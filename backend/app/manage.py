"""
Admin commands (run from backend/):

    .venv/bin/python -m app.manage create-staff --username priya --role reception --name "Priya Kumari"
    .venv/bin/python -m app.manage deactivate-staff --username priya
    .venv/bin/python -m app.manage seed-demo [--reset]     # fictional demo patients & appointments
    .venv/bin/python -m app.manage send-reminders          # run once a day (e.g. 8 am) from a scheduler

The password is typed in privately (never on the command line, so it doesn't end up in shell history).
"""

import argparse
import asyncio
import getpass
import sys

from . import db
from .config import get_settings
from .demo_data import reset_demo_data, seed_demo_data
from .notifications import run_due_reminders
from .staff_accounts import create_staff, demo_accounts_enabled


async def main(args: argparse.Namespace) -> int:
    database = await db.connect()
    try:
        if args.command == "send-reminders":
            await run_due_reminders(database)
            print("Reminders checked.")
            return 0
        if args.command == "seed-demo":
            if not demo_accounts_enabled(get_settings()):
                print("Refusing: demo data is only allowed in demo mode, never in production.")
                return 1
            if args.reset:
                await reset_demo_data(database)
            print(f"Added {await seed_demo_data(database)} demo appointments (fictional patients).")
            return 0
        username = args.username.strip().lower()
        if args.command == "create-staff":
            if await database.staff.find_one({"username": username}):
                print(f"User '{username}' already exists.")
                return 1
            password = getpass.getpass("Password (min 8 characters): ")
            if len(password) < 8 or password != getpass.getpass("Repeat password: "):
                print("Passwords must match and be at least 8 characters.")
                return 1
            await create_staff(database, username, password, args.role, args.name)
            print(f"Created {args.role} account '{username}'.")
        elif args.command == "deactivate-staff":
            result = await database.staff.update_one({"username": username}, {"$set": {"active": False}})
            print("Deactivated." if result.modified_count else "No such active user.")
        return 0
    finally:
        await db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="python -m app.manage")
    sub = parser.add_subparsers(dest="command", required=True)
    create = sub.add_parser("create-staff")
    create.add_argument("--username", required=True)
    create.add_argument("--role", required=True, choices=["reception", "doctor"])
    create.add_argument("--name", required=True)
    deactivate = sub.add_parser("deactivate-staff")
    deactivate.add_argument("--username", required=True)
    sub.add_parser("send-reminders")
    seed = sub.add_parser("seed-demo")
    seed.add_argument("--reset", action="store_true", help="remove previous demo data first")
    sys.exit(asyncio.run(main(parser.parse_args())))
