#!/usr/bin/env python3
"""
Seed the database with realistic sample news data for development/testing.

Usage:
    python -m scripts.seed_sample_data          # Insert sample data
    python -m scripts.seed_sample_data --remove  # Remove all sample data
    python -m scripts.seed_sample_data --check   # Check if sample data exists

All sample data uses source domains prefixed with "seed--" so it can be
cleanly identified and removed without affecting real ingested data.
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone

# Ensure backend package is importable
sys.path.insert(0, ".")

from src.core.database import SessionLocal
from src.models.article import Article
from src.models.article_chunk import ArticleChunk
from src.models.source import Source
from src.models.story import Story

SEED_DOMAIN_PREFIX = "seed--"


# ---------------------------------------------------------------------------
# Source definitions (realistic outlets with bias ratings)
# Domains are prefixed so we can identify and remove seed data later.
# ---------------------------------------------------------------------------
SOURCES = [
    # Left
    {
        "name": "The Guardian",
        "domain": f"{SEED_DOMAIN_PREFIX}theguardian.com",
        "bias_rating": "left",
        "confidence": 0.95,
    },
    {
        "name": "MSNBC",
        "domain": f"{SEED_DOMAIN_PREFIX}msnbc.com",
        "bias_rating": "left",
        "confidence": 0.90,
    },
    {
        "name": "HuffPost",
        "domain": f"{SEED_DOMAIN_PREFIX}huffpost.com",
        "bias_rating": "left",
        "confidence": 0.85,
    },
    # Center-Left
    {
        "name": "NPR",
        "domain": f"{SEED_DOMAIN_PREFIX}npr.org",
        "bias_rating": "center",
        "confidence": 0.90,
    },
    {
        "name": "BBC News",
        "domain": f"{SEED_DOMAIN_PREFIX}bbc.com",
        "bias_rating": "center",
        "confidence": 0.95,
    },
    {
        "name": "Reuters",
        "domain": f"{SEED_DOMAIN_PREFIX}reuters.com",
        "bias_rating": "center",
        "confidence": 0.95,
    },
    {
        "name": "Associated Press",
        "domain": f"{SEED_DOMAIN_PREFIX}apnews.com",
        "bias_rating": "center",
        "confidence": 0.95,
    },
    # Right
    {
        "name": "Fox News",
        "domain": f"{SEED_DOMAIN_PREFIX}foxnews.com",
        "bias_rating": "right",
        "confidence": 0.90,
    },
    {
        "name": "The Daily Wire",
        "domain": f"{SEED_DOMAIN_PREFIX}dailywire.com",
        "bias_rating": "right",
        "confidence": 0.85,
    },
    {
        "name": "New York Post",
        "domain": f"{SEED_DOMAIN_PREFIX}nypost.com",
        "bias_rating": "right",
        "confidence": 0.85,
    },
]

# ---------------------------------------------------------------------------
# Story + Article definitions
# Each story has articles from multiple perspectives to demonstrate the
# bias bar, blindspot detection, and source grouping features.
# ---------------------------------------------------------------------------

now = datetime.now(timezone.utc)


def _url(domain: str, slug: str) -> str:
    """Generate a fake but realistic-looking article URL."""
    return f"https://{domain.replace(SEED_DOMAIN_PREFIX, '')}/2026/03/{slug}"


STORIES = [
    # ── Story 1: Balanced coverage (3L, 3C, 2R) ──────────────────────────
    {
        "headline": "Global Climate Summit Reaches Landmark Agreement on Carbon Emissions",
        "summary": "World leaders at the 2026 Global Climate Summit in Geneva have agreed to a binding framework that would cut carbon emissions by 45% by 2035. The agreement includes a $500 billion green transition fund for developing nations, but critics say enforcement mechanisms remain weak.",
        "published_at": now - timedelta(hours=2),
        "left_count": 3,
        "center_count": 3,
        "right_count": 2,
        "is_blindspot": False,
        "articles": [
            {
                "source": "The Guardian",
                "title": "Historic climate deal: World agrees to 45% emissions cut by 2035",
                "slug": "historic-climate-deal-emissions-cut",
                "snippet": "In what environmentalists are calling the most significant climate agreement since Paris, negotiators reached consensus on legally binding emission reduction targets after two weeks of intense negotiations in Geneva.",
            },
            {
                "source": "MSNBC",
                "title": "Climate summit delivers bold promise — but can nations keep it?",
                "slug": "climate-summit-bold-promise",
                "snippet": "The Geneva Climate Accord represents a dramatic escalation of global ambition on emissions, with the $500 billion green fund addressing long-standing demands from the Global South for climate justice.",
            },
            {
                "source": "HuffPost",
                "title": "Young activists celebrate 'once-in-a-generation' climate deal",
                "slug": "young-activists-celebrate-climate-deal",
                "snippet": "Youth climate movements across the globe erupted in cautious celebration as the Geneva summit produced what many are calling the strongest international climate agreement ever negotiated.",
            },
            {
                "source": "Reuters",
                "title": "Nations agree to 45% emission cuts in Geneva climate pact",
                "slug": "nations-agree-emission-cuts-geneva",
                "snippet": "Representatives from 195 countries signed the Geneva Climate Accord on Tuesday, committing to reduce carbon emissions by 45% from 2020 levels by 2035, with verification protocols to begin in 2028.",
            },
            {
                "source": "BBC News",
                "title": "Geneva climate summit: What the new deal means for you",
                "slug": "geneva-climate-summit-new-deal-explainer",
                "snippet": "The Geneva Climate Accord will affect energy prices, transportation, and industry across every signatory nation. Here's what the agreement contains and how it could change daily life.",
            },
            {
                "source": "Associated Press",
                "title": "Climate deal reached at Geneva summit after marathon talks",
                "slug": "climate-deal-geneva-summit-marathon",
                "snippet": "After 36 hours of continuous negotiation, delegates from nearly 200 countries agreed to the Geneva Climate Accord, setting the most aggressive binding emissions targets in international history.",
            },
            {
                "source": "Fox News",
                "title": "Geneva climate pact could cost US economy trillions, analysts warn",
                "slug": "geneva-climate-pact-economy-cost",
                "snippet": "Economic analysts are raising concerns about the potential impact of the new Geneva Climate Accord on American industries, with some projecting compliance costs could exceed $2 trillion over the next decade.",
            },
            {
                "source": "The Daily Wire",
                "title": "Climate deal's $500B fund raises questions about US taxpayer burden",
                "slug": "climate-deal-fund-taxpayer-burden",
                "snippet": "The green transition fund at the heart of the Geneva Climate Accord would require the United States to contribute an estimated $150 billion, sparking debate about whether the funds will be used effectively.",
            },
        ],
    },
    # ── Story 2: Blindspot — mostly left coverage (4L, 1C, 0R) ───────────
    {
        "headline": "Tech Workers Union Movement Gains Momentum Across Silicon Valley",
        "summary": "A wave of unionization efforts has swept through major tech companies, with workers at three major firms filing for union elections this month. Organizers cite concerns about layoffs, return-to-office mandates, and AI replacing jobs.",
        "published_at": now - timedelta(hours=5),
        "left_count": 4,
        "center_count": 1,
        "right_count": 0,
        "is_blindspot": True,
        "blindspot_perspective": "left",
        "articles": [
            {
                "source": "The Guardian",
                "title": "Silicon Valley's union wave: Tech workers fight back against AI anxiety",
                "slug": "silicon-valley-union-wave-ai-anxiety",
                "snippet": "From San Francisco to Austin, tech workers are organizing at unprecedented rates as fears about artificial intelligence displacing jobs combine with frustration over mass layoffs and mandatory return-to-office policies.",
            },
            {
                "source": "MSNBC",
                "title": "Why tech's union movement could reshape the American workplace",
                "slug": "tech-union-movement-reshape-workplace",
                "snippet": "Labor organizers say the tech industry's embrace of unions represents a seismic shift in how American workers view collective bargaining, particularly among younger employees who once saw unions as relics.",
            },
            {
                "source": "HuffPost",
                "title": "'We're not just coders — we're workers': Inside tech's labor awakening",
                "slug": "tech-labor-awakening-coders-workers",
                "snippet": "Interviews with dozens of tech employees reveal a workforce increasingly disillusioned with the industry's promises, turning to unions as a way to secure stable employment in an era of rapid AI advancement.",
            },
            {
                "source": "MSNBC",
                "title": "Three major tech firms face union elections in a single month",
                "slug": "three-tech-firms-union-elections",
                "snippet": "In an unprecedented development, employees at three of the nation's largest technology companies have simultaneously filed for National Labor Relations Board elections, signaling broad momentum for organized labor in tech.",
            },
            {
                "source": "NPR",
                "title": "Tech unionization efforts accelerate amid industry changes",
                "slug": "tech-unionization-efforts-accelerate",
                "snippet": "The latest round of union filings in the technology sector reflects growing worker concerns about job security, with the NLRB reporting a 40% increase in tech-sector petitions compared to last year.",
            },
        ],
    },
    # ── Story 3: Balanced coverage (2L, 2C, 3R) ──────────────────────────
    {
        "headline": "Federal Reserve Signals Potential Rate Cuts Amid Cooling Inflation Data",
        "summary": "Federal Reserve Chair indicated that rate cuts could begin as early as Q2 2026 after inflation fell to 2.3%, the lowest level in three years. Markets rallied on the news, but economists debate whether the easing cycle should begin now.",
        "published_at": now - timedelta(hours=8),
        "left_count": 2,
        "center_count": 2,
        "right_count": 3,
        "is_blindspot": False,
        "articles": [
            {
                "source": "The Guardian",
                "title": "Fed rate cut signal raises hopes for housing market relief",
                "slug": "fed-rate-cut-housing-market-relief",
                "snippet": "Prospective homebuyers may finally see some relief as the Federal Reserve's signal of potential rate cuts could bring mortgage rates down from their elevated levels, easing the housing affordability crisis.",
            },
            {
                "source": "MSNBC",
                "title": "Rate cuts could ease pressure on working families, economists say",
                "slug": "rate-cuts-ease-pressure-working-families",
                "snippet": "Economic analysts say potential Federal Reserve rate cuts would primarily benefit working families struggling with high borrowing costs, from credit card debt to auto loans and mortgages.",
            },
            {
                "source": "Reuters",
                "title": "Fed Chair signals potential Q2 rate cuts as inflation hits 2.3%",
                "slug": "fed-chair-signals-q2-rate-cuts",
                "snippet": "The Federal Reserve signaled it may begin cutting interest rates in the second quarter of 2026 after the latest Consumer Price Index showed inflation at 2.3%, approaching the central bank's 2% target.",
            },
            {
                "source": "Associated Press",
                "title": "Markets surge on Federal Reserve rate cut signal",
                "slug": "markets-surge-fed-rate-cut-signal",
                "snippet": "The S&P 500 rose 2.1% and the Dow gained over 600 points after Federal Reserve officials indicated that the central bank is prepared to begin easing monetary policy in coming months.",
            },
            {
                "source": "Fox News",
                "title": "Fed rate cut talk: Too soon or overdue? Economists divided",
                "slug": "fed-rate-cut-economists-divided",
                "snippet": "While markets celebrated the Fed's dovish pivot, several prominent economists warned that cutting rates prematurely could reignite inflation that took years to bring under control.",
            },
            {
                "source": "The Daily Wire",
                "title": "Rate cuts won't fix underlying spending problems, fiscal hawks say",
                "slug": "rate-cuts-spending-problems-fiscal-hawks",
                "snippet": "Fiscal conservatives argue that the Federal Reserve's anticipated rate cuts address symptoms rather than causes, pointing to federal spending levels as the primary driver of persistent inflationary pressure.",
            },
            {
                "source": "New York Post",
                "title": "Wall Street cheers Fed's rate cut hint — but is Main Street ready?",
                "slug": "wall-street-cheers-main-street-ready",
                "snippet": "The disconnect between Wall Street's euphoric reaction and Main Street's ongoing cost-of-living struggles raises questions about who truly benefits from the Fed's monetary policy shifts.",
            },
        ],
    },
    # ── Story 4: Blindspot — mostly right coverage (0L, 1C, 4R) ──────────
    {
        "headline": "Border Security Bill Advances with Bipartisan Support in Senate",
        "summary": "A new border security bill cleared a Senate committee with support from both parties, proposing $18 billion for border infrastructure, technology upgrades, and additional personnel. The bill also includes provisions for asylum processing reform.",
        "published_at": now - timedelta(hours=12),
        "left_count": 0,
        "center_count": 1,
        "right_count": 4,
        "is_blindspot": True,
        "blindspot_perspective": "right",
        "articles": [
            {
                "source": "BBC News",
                "title": "US Senate committee advances bipartisan border security bill",
                "slug": "us-senate-bipartisan-border-security-bill",
                "snippet": "A bipartisan group of US senators advanced a $18 billion border security package out of committee, combining physical infrastructure investments with technology and asylum processing reforms.",
            },
            {
                "source": "Fox News",
                "title": "Border bill clears committee: Inside the $18B security package",
                "slug": "border-bill-clears-committee-security-package",
                "snippet": "The Senate Homeland Security Committee advanced a comprehensive border security bill that includes funding for physical barriers, surveillance technology, and 5,000 additional Border Patrol agents.",
            },
            {
                "source": "The Daily Wire",
                "title": "Border security finally gets serious: New bill addresses enforcement gaps",
                "slug": "border-security-enforcement-gaps",
                "snippet": "After years of debate, the new border security bill takes concrete steps to address enforcement shortfalls, including mandatory E-Verify for employers and expedited removal proceedings for certain cases.",
            },
            {
                "source": "New York Post",
                "title": "Senate border bill: $18B plan includes tech, personnel, and infrastructure",
                "slug": "senate-border-bill-tech-personnel",
                "snippet": "The bipartisan border bill moving through the Senate would deploy AI-powered surveillance systems, hire thousands of new agents, and invest in physical infrastructure at key crossing points.",
            },
            {
                "source": "Fox News",
                "title": "Border communities react to security bill: 'It's about time'",
                "slug": "border-communities-react-security-bill",
                "snippet": "Residents of border towns from Texas to Arizona expressed relief at the advancing legislation, saying they've waited years for federal action on the security and humanitarian challenges they face daily.",
            },
        ],
    },
    # ── Story 5: Balanced (2L, 3C, 2R) ───────────────────────────────────
    {
        "headline": "AI Regulation Framework Proposed by Bipartisan Congressional Coalition",
        "summary": "A coalition of lawmakers from both parties unveiled a comprehensive AI regulation framework that would require transparency in AI systems, establish safety testing requirements, and create a new federal oversight body. The tech industry has offered mixed reactions.",
        "published_at": now - timedelta(hours=16),
        "left_count": 2,
        "center_count": 3,
        "right_count": 2,
        "is_blindspot": False,
        "articles": [
            {
                "source": "The Guardian",
                "title": "US lawmakers propose sweeping AI regulation with teeth",
                "slug": "us-lawmakers-propose-ai-regulation",
                "snippet": "The proposed AI Safety and Transparency Act would give a new federal agency the power to audit AI systems, require companies to disclose training data sources, and establish mandatory safety testing before deployment.",
            },
            {
                "source": "HuffPost",
                "title": "Workers cheer AI regulation bill that addresses job displacement",
                "slug": "workers-cheer-ai-regulation-job-displacement",
                "snippet": "Labor groups praised provisions in the bipartisan AI regulation bill that would require companies to provide 90-day notice before implementing AI systems that could displace workers.",
            },
            {
                "source": "NPR",
                "title": "What the proposed AI regulation framework would actually do",
                "slug": "proposed-ai-regulation-framework-explainer",
                "snippet": "The bipartisan AI Safety and Transparency Act proposes three pillars: mandatory pre-deployment safety testing, algorithmic transparency requirements, and a new Federal AI Oversight Commission.",
            },
            {
                "source": "Reuters",
                "title": "Bipartisan AI bill introduced in Congress, tech sector reacts",
                "slug": "bipartisan-ai-bill-congress-tech-reacts",
                "snippet": "A bipartisan group of 12 senators and 28 House members introduced comprehensive AI legislation on Wednesday, drawing mixed reactions from technology companies who support some provisions but oppose others.",
            },
            {
                "source": "BBC News",
                "title": "US takes step toward AI regulation with new bipartisan bill",
                "slug": "us-step-ai-regulation-bipartisan-bill",
                "snippet": "The United States moved closer to comprehensive artificial intelligence regulation as lawmakers from both parties proposed a framework that balances innovation with safety requirements.",
            },
            {
                "source": "Fox News",
                "title": "AI regulation bill: Innovation safeguard or government overreach?",
                "slug": "ai-regulation-innovation-overreach",
                "snippet": "While the bipartisan AI bill has broad support, some legislators and industry leaders worry that overly prescriptive regulations could drive AI development overseas and hamper American competitiveness.",
            },
            {
                "source": "The Daily Wire",
                "title": "New AI oversight agency proposed: Do we need another federal bureaucracy?",
                "slug": "ai-oversight-agency-federal-bureaucracy",
                "snippet": "The proposal to create a Federal AI Oversight Commission has sparked debate about whether a new government body is the right approach, with some arguing existing agencies could handle the responsibility.",
            },
        ],
    },
    # ── Story 6: Small balanced story (1L, 1C, 1R) ───────────────────────
    {
        "headline": "Space Tourism Industry Reaches New Milestone with 1,000th Civilian Flight",
        "summary": "The commercial space tourism industry celebrated a milestone as the 1,000th civilian reached orbit, marking rapid growth in an industry that barely existed five years ago. Companies are now competing on price, with suborbital flights dropping below $100,000.",
        "published_at": now - timedelta(hours=20),
        "left_count": 1,
        "center_count": 1,
        "right_count": 1,
        "is_blindspot": False,
        "articles": [
            {
                "source": "The Guardian",
                "title": "Space for the rich? 1,000th civilian reaches orbit as prices remain steep",
                "slug": "space-rich-1000th-civilian-orbit",
                "snippet": "While the space tourism industry celebrates its 1,000th civilian passenger, critics point out that the experience remains accessible only to the ultra-wealthy, raising questions about the industry's environmental impact.",
            },
            {
                "source": "Reuters",
                "title": "Space tourism hits milestone: 1,000 civilians have now reached orbit",
                "slug": "space-tourism-milestone-1000-civilians",
                "snippet": "The commercial space industry reached a symbolic milestone on Monday as the 1,000th civilian passenger completed an orbital flight, with industry data showing suborbital flight prices have dropped 60% since 2024.",
            },
            {
                "source": "New York Post",
                "title": "Final frontier goes mainstream: 1,000th space tourist takes flight",
                "slug": "final-frontier-mainstream-1000th-tourist",
                "snippet": "The space tourism industry is booming, with three companies now offering regular flights and prices trending downward. Industry analysts predict space tourism could become a $10 billion market by 2030.",
            },
        ],
    },
    # ── Story 7: Balanced (2L, 2C, 2R) ───────────────────────────────────
    {
        "headline": "National Education Standards Overhaul Proposed to Address Pandemic Learning Gaps",
        "summary": "The Department of Education proposed a major overhaul of national education standards to address persistent learning gaps from the pandemic era. The plan includes increased funding for tutoring programs, updated math and reading benchmarks, and new teacher training requirements.",
        "published_at": now - timedelta(days=1),
        "left_count": 2,
        "center_count": 2,
        "right_count": 2,
        "is_blindspot": False,
        "articles": [
            {
                "source": "MSNBC",
                "title": "Education overhaul targets pandemic learning loss with bold investment",
                "slug": "education-overhaul-pandemic-learning-loss",
                "snippet": "The proposed education standards overhaul would direct $30 billion toward tutoring and after-school programs, with a focus on low-income communities that were disproportionately affected by pandemic-era school closures.",
            },
            {
                "source": "The Guardian",
                "title": "US education reset: New standards aim to close widening achievement gaps",
                "slug": "us-education-reset-achievement-gaps",
                "snippet": "Education researchers welcome the proposed standards overhaul as an acknowledgment that pandemic learning losses have created a generational challenge requiring sustained, evidence-based intervention.",
            },
            {
                "source": "NPR",
                "title": "New education standards proposed to address post-pandemic gaps",
                "slug": "new-education-standards-post-pandemic-gaps",
                "snippet": "The Department of Education's proposed overhaul would update math and reading benchmarks for the first time in eight years while creating new requirements for teacher preparation programs nationwide.",
            },
            {
                "source": "Associated Press",
                "title": "Education Dept. proposes sweeping standards update, $30B in funding",
                "slug": "education-dept-standards-update-funding",
                "snippet": "The Department of Education on Thursday proposed comprehensive updates to national education standards and requested $30 billion in new funding for tutoring, teacher training, and technology upgrades.",
            },
            {
                "source": "Fox News",
                "title": "Education overhaul sparks debate: More federal control or needed reform?",
                "slug": "education-overhaul-debate-federal-control",
                "snippet": "While supporters say updated standards are overdue, critics worry the proposal represents federal overreach into what has traditionally been a state and local responsibility.",
            },
            {
                "source": "The Daily Wire",
                "title": "Parents' groups question whether new standards address root causes of learning loss",
                "slug": "parents-groups-question-standards-learning-loss",
                "snippet": "Parent advocacy organizations argue that the proposed education overhaul focuses too heavily on funding and not enough on curriculum content and parental involvement in addressing post-pandemic learning gaps.",
            },
        ],
    },
]

# ---------------------------------------------------------------------------
# Article chunks — sample content for RAG/chat grounding
# One chunk per article to enable basic chat functionality
# ---------------------------------------------------------------------------


def _make_chunk(article_title: str, snippet: str, bias_label: str) -> dict:
    """Create a minimal article chunk for RAG purposes."""
    return {
        "chunk_index": 0,
        "bias_label": bias_label,
        "content": f"{article_title}\n\n{snippet}",
        "metadata_": {"source": "seed_data", "chunk_type": "full_snippet"},
    }


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------


def seed(db):
    """Insert all sample data into the database."""
    # 1. Create sources
    source_map = {}
    for s in SOURCES:
        source = Source(**s)
        db.add(source)
        db.flush()
        source_map[s["name"]] = source
    print(f"  Created {len(source_map)} sources")

    # 2. Create stories with articles and chunks
    story_count = 0
    article_count = 0
    chunk_count = 0

    for story_data in STORIES:
        articles_data = story_data.pop("articles")
        story = Story(**story_data)
        db.add(story)
        db.flush()
        story_count += 1

        for art in articles_data:
            source = source_map[art["source"]]
            article = Article(
                story_id=story.id,
                source_id=source.id,
                title=art["title"],
                url=_url(source.domain, art["slug"]),
                published_at=story.published_at - timedelta(minutes=15),
                snippet=art["snippet"],
                image_url=None,
                embedding=None,
            )
            db.add(article)
            db.flush()
            article_count += 1

            # Create one chunk per article for RAG
            chunk = ArticleChunk(
                article_id=article.id,
                story_id=story.id,
                **_make_chunk(art["title"], art["snippet"], source.bias_rating),
            )
            db.add(chunk)
            chunk_count += 1

    db.commit()
    print(
        f"  Created {story_count} stories, {article_count} articles, {chunk_count} chunks"
    )


def remove(db):
    """Remove all seed data (identified by seed-- domain prefix)."""
    # Find seed source IDs
    seed_sources = (
        db.query(Source).filter(Source.domain.like(f"{SEED_DOMAIN_PREFIX}%")).all()
    )
    if not seed_sources:
        print("  No seed data found.")
        return

    seed_source_ids = [s.id for s in seed_sources]

    # Find articles from seed sources → get story IDs
    seed_articles = (
        db.query(Article).filter(Article.source_id.in_(seed_source_ids)).all()
    )
    seed_story_ids = list({a.story_id for a in seed_articles})

    # Delete chunks for seed stories
    chunk_count = (
        db.query(ArticleChunk)
        .filter(ArticleChunk.story_id.in_(seed_story_ids))
        .delete(synchronize_session=False)
    )
    print(f"  Deleted {chunk_count} article chunks")

    # Delete articles from seed sources
    article_count = (
        db.query(Article)
        .filter(Article.source_id.in_(seed_source_ids))
        .delete(synchronize_session=False)
    )
    print(f"  Deleted {article_count} articles")

    # Delete stories that ONLY had seed articles (check for remaining articles)
    for story_id in seed_story_ids:
        remaining = db.query(Article).filter(Article.story_id == story_id).count()
        if remaining == 0:
            db.query(Story).filter(Story.id == story_id).delete(
                synchronize_session=False
            )
            print(f"  Deleted story {story_id} (no remaining articles)")

    # Delete seed sources
    source_count = (
        db.query(Source)
        .filter(Source.domain.like(f"{SEED_DOMAIN_PREFIX}%"))
        .delete(synchronize_session=False)
    )
    print(f"  Deleted {source_count} sources")

    db.commit()


def check(db):
    """Check if seed data exists."""
    count = (
        db.query(Source).filter(Source.domain.like(f"{SEED_DOMAIN_PREFIX}%")).count()
    )
    if count > 0:
        print(f"  Seed data found: {count} sources with '{SEED_DOMAIN_PREFIX}' prefix")
        story_ids = (
            db.query(Article.story_id)
            .join(Source)
            .filter(Source.domain.like(f"{SEED_DOMAIN_PREFIX}%"))
            .distinct()
            .count()
        )
        article_count = (
            db.query(Article)
            .join(Source)
            .filter(Source.domain.like(f"{SEED_DOMAIN_PREFIX}%"))
            .count()
        )
        print(f"  {story_ids} stories, {article_count} articles")
    else:
        print("  No seed data found.")


def main():
    parser = argparse.ArgumentParser(description="Seed or remove sample news data")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--remove", action="store_true", help="Remove all seed data")
    group.add_argument("--check", action="store_true", help="Check if seed data exists")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.remove:
            print("Removing seed data...")
            remove(db)
            print("Done.")
        elif args.check:
            print("Checking for seed data...")
            check(db)
        else:
            # Check if seed data already exists
            existing = (
                db.query(Source)
                .filter(Source.domain.like(f"{SEED_DOMAIN_PREFIX}%"))
                .count()
            )
            if existing > 0:
                print(
                    f"Seed data already exists ({existing} sources). Run with --remove first."
                )
                sys.exit(1)
            print("Seeding sample data...")
            seed(db)
            print("Done. Run with --remove to clean up.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
