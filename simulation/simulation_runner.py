"""
Simulation Runner CLI — Entry point for the A2A Marketplace simulation.

Usage:
  python simulation/simulation_runner.py --scenario all
  python simulation/simulation_runner.py --scenario deadlock --verbose
  python simulation/simulation_runner.py --scenario buyer_storm --buyers 10 --sellers 100
  python simulation/simulation_runner.py --buyer B001

Available scenarios: all, deadlock, collusion, floor_breach, buyer_storm,
  stale_inventory, moq_mismatch, payment_mismatch, single_monopoly, timeout,
  counter_spiral, quality_dispute, seasonal_spike, gst_mismatch, fake_msme,
  rapid_price_change, partial_fulfillment, currency_rounding, delivery_conflict,
  multi_category, blacklist, baseline
"""
import argparse
import asyncio
import importlib
import json
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

sys.path.insert(0, str(Path(__file__).parent.parent))

from simulation.agents.marketplace import MarketplaceOrchestrator

console = Console(highlight=False)
# Force UTF-8 on Windows to support INR symbol
import io
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

EDGE_CASE_MODULES = {
    "deadlock": "simulation.edge_cases.test_deadlock",
    "collusion": "simulation.edge_cases.test_collusion",
    "floor_breach": "simulation.edge_cases.test_floor_breach",
    "buyer_storm": "simulation.edge_cases.test_buyer_storm",
    "stale_inventory": "simulation.edge_cases.test_stale_inventory",
    "moq_mismatch": "simulation.edge_cases.test_moq_mismatch",
    "payment_mismatch": "simulation.edge_cases.test_payment_mismatch",
    "single_monopoly": "simulation.edge_cases.test_single_monopoly",
    "timeout": "simulation.edge_cases.test_timeout",
    "counter_spiral": "simulation.edge_cases.test_counter_spiral",
    "quality_dispute": "simulation.edge_cases.test_quality_dispute",
    "seasonal_spike": "simulation.edge_cases.test_seasonal_spike",
    "gst_mismatch": "simulation.edge_cases.test_gst_mismatch",
    "fake_msme": "simulation.edge_cases.test_fake_msme",
    "rapid_price_change": "simulation.edge_cases.test_rapid_price_change",
    "partial_fulfillment": "simulation.edge_cases.test_partial_fulfillment",
    "currency_rounding": "simulation.edge_cases.test_currency_rounding",
    "delivery_conflict": "simulation.edge_cases.test_delivery_conflict",
    "multi_category": "simulation.edge_cases.test_multi_category",
    "blacklist": "simulation.edge_cases.test_blacklist",
}


async def run_baseline(orchestrator: MarketplaceOrchestrator, verbose: bool):
    """Standard simulation: all buyers negotiate with all sellers."""
    console.print(Panel("[bold green]BASELINE SIMULATION[/bold green] — All buyers vs all sellers"))
    results = await orchestrator.run_all_buyers(top_n=10, max_concurrent_buyers=10)

    table = Table(title="Simulation Results", box=box.ROUNDED)
    table.add_column("Buyer", style="cyan")
    table.add_column("Queried", justify="right")
    table.add_column("Deals", style="green", justify="right")
    table.add_column("Failed", style="red", justify="right")
    table.add_column("Top Price", justify="right")

    for r in results:
        top_price = (
            f"Rs.{r['top_deals'][0]['final_price']:,.2f}"
            if r["top_deals"]
            else "No deals"
        )
        table.add_row(
            r["buyer_name"],
            str(r["total_sellers_queried"]),
            str(r["deals_reached"]),
            str(r["deals_failed"]),
            top_price,
        )
        if verbose:
            console.print(r["shortlist_text"])

    console.print(table)
    return results


async def run_edge_case(scenario: str, verbose: bool) -> dict:
    """Dynamically load and run an edge case module."""
    module_path = EDGE_CASE_MODULES.get(scenario)
    if not module_path:
        console.print(f"[red]Unknown scenario: {scenario}[/red]")
        return {"scenario": scenario, "status": "not_found"}

    try:
        mod = importlib.import_module(module_path)
        result = await mod.run(verbose=verbose)
        status = "PASS" if result.get("passed") else "FAIL"
        color = "green" if status == "PASS" else "red"
        console.print(
            Panel(
                f"[bold {color}]{status}[/bold {color}] — {scenario}\n"
                + result.get("summary", ""),
                title=f"Edge Case: {scenario.upper()}",
            )
        )
        return {"scenario": scenario, "status": status, **result}
    except Exception as e:
        console.print(f"[red]ERROR in {scenario}: {e}[/red]")
        import traceback; traceback.print_exc()
        return {"scenario": scenario, "status": "ERROR", "error": str(e)}


async def main():
    parser = argparse.ArgumentParser(description="A2A Marketplace Simulation Runner")
    parser.add_argument("--scenario", default="baseline",
                        help="Scenario to run: 'all', 'baseline', or edge case name")
    parser.add_argument("--buyer", default=None, help="Run for a specific buyer ID (e.g. B001)")
    parser.add_argument("--verbose", action="store_true", help="Print full shortlists")
    parser.add_argument("--top-n", type=int, default=10, help="Number of top deals to return")
    args = parser.parse_args()

    console.print(Panel(
        "[bold blue]A2A B2B Marketplace Simulation[/bold blue]\n"
        "Indian MSME Autonomous Negotiation System",
        subtitle=f"Scenario: [yellow]{args.scenario}[/yellow]"
    ))

    orchestrator = MarketplaceOrchestrator()
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)

    results = []

    if args.scenario == "all":
        # Run baseline + all edge cases
        baseline_results = await run_baseline(orchestrator, args.verbose)
        results.append({"scenario": "baseline", "data": baseline_results})

        console.rule("[yellow]Running 20 Edge Cases[/yellow]")
        edge_results = []
        for scenario_name in EDGE_CASE_MODULES:
            r = await run_edge_case(scenario_name, args.verbose)
            edge_results.append(r)

        # Summary table
        summary_table = Table(title="Edge Case Results", box=box.SIMPLE)
        summary_table.add_column("#", justify="right")
        summary_table.add_column("Scenario")
        summary_table.add_column("Status", justify="center")
        summary_table.add_column("Notes")

        for i, r in enumerate(edge_results, 1):
            color = "green" if r["status"] == "PASS" else "red"
            summary_table.add_row(
                str(i),
                r["scenario"],
                f"[{color}]{r['status']}[/{color}]",
                r.get("summary", "")[:60],
            )
        console.print(summary_table)
        results.extend(edge_results)

    elif args.scenario == "baseline":
        if args.buyer:
            buyer_req = orchestrator.get_buyer_by_id(args.buyer)
            if not buyer_req:
                console.print(f"[red]Buyer {args.buyer} not found.[/red]")
                return
            r = await orchestrator.run_single_buyer(buyer_req, top_n=args.top_n)
            console.print(r["shortlist_text"])
            results.append(r)
        else:
            results = await run_baseline(orchestrator, args.verbose)

    else:
        r = await run_edge_case(args.scenario, args.verbose)
        results.append(r)

    # Save report
    report_path = reports_dir / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{args.scenario}.json"
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    console.print(f"\n[dim]Report saved → {report_path}[/dim]")


if __name__ == "__main__":
    asyncio.run(main())
