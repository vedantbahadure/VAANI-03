"""Real starter knowledge base for VAANI RAG. Factual, citable content across domains.
Idempotent: only seeds when the vector store / documents table is empty."""
import repositories as repo
from ingest import ingest_document
from vector_store import get_vector_store

SEED_DOCS = [
    {
        "title": "PM-KISAN Samman Nidhi Scheme",
        "domain": "schemes",
        "source": "pmkisan.gov.in",
        "text": """PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) is a central sector scheme launched in
February 2019 to supplement the financial needs of land-holding farmer families in India.
Under the scheme, eligible farmer families receive an income support of Rs 6,000 per year.
This amount is paid in three equal instalments of Rs 2,000 every four months, transferred
directly into the beneficiary's bank account through Direct Benefit Transfer (DBT).

Eligibility: All land-holding farmer families with cultivable land are eligible, subject to
exclusion criteria. Excluded categories include institutional land holders, families with
members who are or were constitutional post holders, serving or retired government employees
(with some exceptions for Group D / Class IV staff), income tax payers in the last assessment
year, and professionals like doctors, engineers, lawyers and chartered accountants.

How to apply: Farmers can register through the PM-KISAN portal (pmkisan.gov.in), the PM-KISAN
mobile app, or the nearest Common Service Centre (CSC). Required documents include Aadhaar card,
bank account details, and land record/ownership documents. Aadhaar-based e-KYC is mandatory to
receive instalments. Farmers can check beneficiary status and correct details on the portal.

Key points for farmers: Ensure your name in land records, Aadhaar and bank account match. Keep
your bank account linked to Aadhaar (DBT enabled). If an instalment is not received, verify the
beneficiary status online and check for e-KYC completion or name mismatch issues."""
    },
    {
        "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY) - Crop Insurance",
        "domain": "insurance",
        "source": "pmfby.gov.in",
        "text": """Pradhan Mantri Fasal Bima Yojana (PMFBY) is the flagship crop insurance scheme of the
Government of India, launched in 2016. It provides comprehensive risk cover for crops against
non-preventable natural risks from the pre-sowing to post-harvest stage, aiming to stabilise the
income of farmers and encourage them to adopt modern agricultural practices.

Premium rates paid by farmers are kept low: a maximum of 2% of the sum insured for Kharif food
and oilseed crops, 1.5% for Rabi food and oilseed crops, and 5% for annual commercial and
horticultural crops. The remaining premium is shared by the central and state governments.

Coverage: Yield losses due to drought, dry spells, flood, inundation, pests and diseases,
landslides, natural fire and lightning, storm, hailstorm and cyclone are covered. The scheme also
covers prevented sowing, mid-season adversity, post-harvest losses (for up to 14 days after
harvest for crops kept in the field for drying) and localised calamities such as hailstorm,
landslide and inundation.

Enrolment: For loanee farmers who take crop loans / Kisan Credit Card for notified crops,
enrolment may be voluntary. Non-loanee farmers can enrol through banks, insurance company agents,
CSCs, or the National Crop Insurance Portal (pmfby.gov.in). Farmers must report crop loss within
72 hours of the event through the crop insurance app, toll-free number, bank or agriculture
department. Documents needed: land records, sowing certificate/declaration, bank account and
Aadhaar."""
    },
    {
        "title": "Primary Agricultural Credit Societies (PACS)",
        "domain": "pacs",
        "source": "Ministry of Cooperation",
        "text": """Primary Agricultural Credit Societies (PACS) are the foundation of the three-tier
short-term cooperative credit structure in India, operating at the village level. Above PACS are
District Central Cooperative Banks (DCCBs) at the district level and State Cooperative Banks
(StCBs) at the state level. PACS provide short-term and medium-term credit and other services
directly to farmer members.

Functions of PACS: providing crop loans and agricultural credit to members, supplying
agricultural inputs such as seeds and fertilizers, distributing essential commodities through
fair price shops, procurement and storage of foodgrains, and offering banking and deposit
services in rural areas. Many PACS also act as service delivery points for government schemes.

Computerisation: The Government of India, through the Ministry of Cooperation, is computerising
around 63,000 functional PACS onto a common national software (ERP) linked with NABARD and the
cooperative banks. This improves transparency, speeds up loan processing, and enables PACS to
offer new services. PACS are being encouraged to diversify into activities such as running
Common Service Centres, PM Kisan Samruddhi Kendras, LPG and petrol distribution, and Jan Aushadhi
Kendras.

Membership: Any farmer or rural resident in the area of operation can become a member by
purchasing a share and paying a nominal fee. Members get voting rights on a one-member-one-vote
basis, reflecting the democratic cooperative principle."""
    },
    {
        "title": "Cooperative Societies Law - Basic Principles and Member Rights",
        "domain": "cooperative",
        "source": "Cooperative Societies Act",
        "text": """A cooperative society is a voluntary association of persons who join together to meet
their common economic, social and cultural needs through a jointly owned and democratically
controlled enterprise. In India, cooperatives are governed by state Cooperative Societies Acts and
by the Multi-State Cooperative Societies Act, 2002 for societies operating in more than one state.
The 97th Constitutional Amendment recognised the right to form cooperatives as a fundamental right.

Seven cooperative principles guide all societies: (1) voluntary and open membership, (2) democratic
member control, (3) member economic participation, (4) autonomy and independence, (5) education,
training and information, (6) cooperation among cooperatives, and (7) concern for community.

Member rights: Every member has the right to attend general body meetings, to vote on a one-member-
one-vote basis regardless of shareholding, to stand for election to the managing committee, to
inspect books and records as provided by the bye-laws, to receive a share of surplus (dividend) as
declared, and to receive services from the society. Members also have duties, including attending
meetings, repaying dues on time, and abiding by the bye-laws.

Governance: A cooperative is managed by a democratically elected managing committee (board), which
is accountable to the general body. Societies must maintain proper accounts, undergo annual audit by
the cooperative department or an approved auditor, and file returns. Disputes are usually resolved
through the Registrar of Cooperative Societies or a cooperative tribunal rather than civil courts."""
    },
    {
        "title": "Kisan Credit Card (KCC) Scheme",
        "domain": "finance",
        "source": "NABARD / RBI",
        "text": """The Kisan Credit Card (KCC) scheme provides farmers with timely and adequate credit
for their cultivation and other needs through a single simplified credit facility. It was
introduced in 1998 and has been extended to cover animal husbandry and fisheries as well.

Purpose: KCC meets the short-term credit requirements for crop cultivation, post-harvest expenses,
produce marketing, consumption needs of the farmer household, working capital for maintenance of
farm assets, and investment credit for agriculture and allied activities.

Interest and benefits: Under the interest subvention scheme, crop loans up to Rs 3 lakh are
available at a subsidised rate. Farmers who repay on time receive a prompt repayment incentive,
effectively reducing the interest rate further (commonly to around 4% per annum for prompt payers).
The card is typically valid for five years with annual review. Loans up to a specified limit (as
revised by RBI, e.g., Rs 1.6 lakh) may be given without collateral.

How to apply: Farmers can apply at any commercial bank, regional rural bank, or cooperative bank /
PACS, or through the PM-KISAN linked KCC drive. Documents required include identity proof (Aadhaar),
address proof, land records, and a passport-size photograph. KCC holders also get personal accident
insurance cover. Farmers should use KCC credit for productive purposes and repay within the crop
season to retain the interest subvention benefit."""
    },
    {
        "title": "Soil Health Card Scheme",
        "domain": "agriculture",
        "source": "soilhealth.dac.gov.in",
        "text": """The Soil Health Card (SHC) scheme, launched in 2015, provides farmers with a report on
the nutrient status of their soil along with recommendations on the appropriate dosage of
nutrients and fertilizers to improve soil health and fertility.

What it contains: A Soil Health Card reports 12 parameters of the soil, including the primary
nutrients Nitrogen (N), Phosphorus (P) and Potassium (K), secondary nutrient Sulphur (S),
micronutrients (Zinc, Iron, Copper, Manganese, Boron), and physical parameters such as pH,
Electrical Conductivity (EC) and Organic Carbon (OC). Based on these, it gives crop-wise
recommendations of fertilizers and soil amendments.

Benefits: By applying fertilizers based on the card's recommendations, farmers can avoid over-use
or under-use of fertilizers, reduce input costs, improve soil health over time, and increase crop
yield and quality. Balanced use of nutrients also protects the environment.

How to get it: Soil samples are collected from farmers' fields by the state agriculture department
on a fixed cycle, tested in soil testing laboratories, and cards are distributed to farmers.
Farmers can also approach the local Krishi Vigyan Kendra (KVK) or agriculture office. The card is
typically issued once every crop cycle so that recommendations stay current with the soil's
changing condition."""
    },
    {
        "title": "e-NAM - National Agriculture Market",
        "domain": "agriculture",
        "source": "enam.gov.in",
        "text": """e-NAM (electronic National Agriculture Market) is a pan-India electronic trading portal
that networks existing Agricultural Produce Market Committee (APMC) mandis to create a unified
national market for agricultural commodities. It was launched in 2016.

Objective: e-NAM aims to promote transparency in price discovery, provide farmers with access to a
larger number of buyers beyond their local mandi, and enable them to get better and remunerative
prices for their produce through online competitive bidding.

How it works: Farmers bring produce to a participating mandi where it is assayed (quality tested).
The lot is listed online, and traders from across the country can bid for it. Once a bid is
accepted, payment is made to the farmer, often directly to the bank account. Farmers can also see
prevailing prices across mandis to make informed selling decisions.

Benefits: reduced dependence on middlemen, transparent auctions, quality-based pricing, and online
payments. Farmers Producer Organisations (FPOs) can also trade on e-NAM. To participate, farmers
register at the mandi or through the e-NAM portal/app with basic details and bank account
information. e-NAM currently integrates a large number of mandis across many states and union
territories."""
    },
    {
        "title": "Financial Literacy - Banking, Savings and Digital Payments for Rural Citizens",
        "domain": "finance",
        "source": "RBI Financial Literacy",
        "text": """Financial literacy helps rural citizens manage money safely, save for the future, and
use banking and digital services with confidence. The foundation is a bank account.

Jan Dhan account: Under the Pradhan Mantri Jan Dhan Yojana (PMJDY), any citizen can open a basic
savings bank account with zero minimum balance. It comes with a RuPay debit card, accident
insurance cover, and access to overdraft facility subject to conditions. Jan Dhan accounts are the
gateway to receiving government benefits directly (DBT).

Saving and insurance: Small, regular savings build a safety net. Government micro-insurance and
pension schemes for the poor include Pradhan Mantri Jeevan Jyoti Bima Yojana (life insurance),
Pradhan Mantri Suraksha Bima Yojana (accident insurance) at very low annual premiums, and Atal
Pension Yojana for old-age pension.

Digital payments: UPI (Unified Payments Interface) lets people send and receive money instantly
using a mobile phone, free of cost for most personal transactions. Always keep your UPI PIN and
bank OTP secret. No genuine bank or government office will ever ask for your PIN, OTP, or full card
details over phone or message.

Avoiding fraud: Never share OTP, PIN or passwords. Be cautious of callers promising loans, prizes
or scheme money in exchange for a fee or your bank details. Verify schemes only through official
websites, banks, or the local government office. Report fraud to your bank immediately and to the
cyber crime helpline 1930."""
    },
    {
        "title": "Pradhan Mantri Kisan Maandhan Yojana (Farmer Pension)",
        "domain": "schemes",
        "source": "maandhan.in",
        "text": """The Pradhan Mantri Kisan Maandhan Yojana (PM-KMY) is a voluntary and contributory
pension scheme for small and marginal farmers, launched in 2019. It provides social security in
old age to farmers who own cultivable land up to 2 hectares.

Benefits: After attaining the age of 60 years, enrolled farmers receive a minimum assured monthly
pension of Rs 3,000. In case of death of the pensioner, the spouse is entitled to receive 50% of
the pension as a family pension.

Contribution: Farmers between 18 and 40 years of age can join. The monthly contribution ranges from
about Rs 55 to Rs 200 depending on the age of entry — the younger the entry age, the lower the
contribution. The Government of India contributes an equal amount to the farmer's pension account,
making it a 50:50 co-contribution.

Enrolment: Farmers can enrol at the nearest Common Service Centre (CSC) with their Aadhaar card and
a savings/Jan Dhan bank account. Those already receiving PM-KISAN benefits can choose to allow their
monthly contribution to be deducted directly from the PM-KISAN benefit, making enrolment easier. The
scheme is administered by the Life Insurance Corporation (LIC) as the pension fund manager."""
    },
    {
        "title": "How to Read and Understand Government Circulars and Notices",
        "domain": "circular",
        "source": "VAANI Guidance",
        "text": """Government circulars, notifications and notices follow a common structure. Understanding
this structure helps citizens act correctly and on time.

Key parts of a circular: (1) the issuing department or office name and address at the top; (2) a
circular / notification number and date, which you should always quote in any follow-up; (3) the
subject line summarising the topic; (4) references to earlier orders or acts; (5) the main body
stating the decision, rule change, or instruction; (6) the effective date; (7) any last date for
application or compliance; and (8) the signature and designation of the issuing authority.

What to look for: Identify who the circular applies to (eligibility), what action is required, the
deadline, and the documents or forms needed. Note any helpline numbers, office addresses, or portal
links for submission. If the circular refers to an earlier order, that order usually contains the
detailed rules.

Practical tips: Keep a copy of the circular and note its number. Submit applications before the last
date and keep an acknowledgement/receipt. If unsure, visit the concerned government office, the
Common Service Centre, or the gram panchayat for help. Beware of anyone charging unofficial fees to
'process' a benefit — most scheme applications are free or carry only a small official charge."""
    },
    {
        "title": "Frequently Asked Questions - VAANI and Government Services",
        "domain": "faq",
        "source": "VAANI FAQ",
        "text": """Q: What documents do I usually need for government schemes?
A: Most agriculture and welfare schemes require an Aadhaar card, a bank account (preferably a Jan
Dhan or DBT-enabled account linked to Aadhaar), and land records for land-based schemes. Keep a
passport-size photograph handy. Ensure your name is spelt the same way across all documents.

Q: What is DBT?
A: Direct Benefit Transfer (DBT) means scheme money is sent straight into your Aadhaar-linked bank
account. To receive DBT, your bank account must be seeded (linked) with Aadhaar and active.

Q: Where can I apply for schemes if I don't have internet at home?
A: Visit the nearest Common Service Centre (CSC), your bank branch, the gram panchayat office, or
the block/tehsil office. PACS in many villages also help with scheme applications.

Q: How do I check if my application or instalment is approved?
A: Most schemes have an online 'beneficiary status' or 'application status' check on their official
portal. You can also ask at the CSC or the concerned office quoting your application number.

Q: How do I avoid fraud?
A: Never share your OTP, ATM PIN or bank password. No official will ask for these. Apply only
through official portals or offices, and report suspicious calls to the cyber helpline 1930.

Q: Can VAANI give me legal advice?
A: VAANI explains schemes, rules and processes in simple language using verified documents, and
always shows its sources. For binding legal or financial decisions, confirm with the concerned
government office or a qualified professional."""
    },
    {
        "title": "Crop Loan Waiver and Debt Relief - What Farmers Should Know",
        "domain": "finance",
        "source": "VAANI Guidance",
        "text": """From time to time, state governments announce crop loan waiver or debt relief schemes
to support farmers facing distress. Because the terms differ by state and by scheme, farmers should
always verify the details of the specific scheme announced in their state.

Common features to check: the cut-off date of loans eligible for waiver, the maximum loan amount
covered, the types of loans included (usually short-term crop loans from cooperative and public
sector banks), whether the account must be a standard or overdue account, and the last date to
complete verification (often Aadhaar-based).

Steps for farmers: Confirm eligibility through the official scheme portal or your bank/PACS. Complete
any required Aadhaar authentication. Keep your loan account passbook and land records ready. Obtain
a written acknowledgement once your loan is included in the waiver list.

Important caution: A loan waiver applies only to eligible existing loans as defined by the scheme; it
does not mean all future loans are free. Continue to repay loans that are not covered to keep your
credit record and Kisan Credit Card benefits intact. Beware of agents who demand money to 'get your
name added' to a waiver list — inclusion is based on official records, not on payment."""
    },
]


async def seed_if_empty() -> int:
    store = get_vector_store()
    existing = await repo.document_count()
    if existing > 0 or store.count() > 0:
        return 0
    seeded = 0
    for d in SEED_DOCS:
        await ingest_document(d["title"], d["domain"], d["text"], d["source"],
                              language="en", origin="seed")
        seeded += 1
    return seeded
