// Bloomfield is a fictional city. Items are modelled on real council agendas so the
// language, process and trade-offs are realistic.

export type Topic = "housing" | "transit" | "streets" | "parks" | "safety" | "environment" | "budget";
export type Persona = "renter" | "homeowner" | "bus" | "bike" | "car" | "student" | "parent" | "business" | "senior";
export type Neighborhood = "Downtown" | "Eastgate" | "Northpark" | "Riverside";
export type Status = "upcoming" | "passed" | "failed";

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  place: string;
  commentDeadline: string;
}

export interface AgendaItem {
  id: string;
  number: string;
  meetingId: string;
  topic: Topic;
  title: string;
  officialTitle: string;
  officialText: string;
  summary: string;
  forYou: Partial<Record<Persona, string>>;
  neighborhoods: Neighborhood[] | "citywide";
  cost: string;
  argumentsFor: string[];
  argumentsAgainst: string[];
  timeline: { label: string; date: string }[];
  status: Status;
  result?: { yes: number; no: number; nextStep: string };
  comments: { support: number; oppose: number };
}

export const CITY = "Bloomfield";
export const TODAY = "2026-10-14";

/** Bloomfield's fictional council: four district seats and three elected citywide. */
const roster: { name: string; seat: string; initials: string }[] = [
  { name: "Mayor Dolores Ibarra", seat: "Mayor · citywide", initials: "DI" },
  { name: "Marcus Webb", seat: "District 1 · Downtown", initials: "MW" },
  { name: "Priya Raman", seat: "District 2 · Eastgate", initials: "PR" },
  { name: "Tom Okafor", seat: "District 3 · Northpark", initials: "TO" },
  { name: "Hannah Lindqvist", seat: "District 4 · Riverside", initials: "HL" },
  { name: "Gabe Moreno", seat: "At-large", initials: "GM" },
  { name: "Ruth Chen", seat: "At-large", initials: "RC" },
];

export const TOPICS: Record<Topic, { label: string; emoji: string; color: string }> = {
  housing: { label: "Housing", emoji: "🏠", color: "var(--t-housing)" },
  transit: { label: "Transit", emoji: "🚌", color: "var(--t-transit)" },
  streets: { label: "Streets", emoji: "🚲", color: "var(--t-streets)" },
  parks: { label: "Parks", emoji: "🌳", color: "var(--t-parks)" },
  safety: { label: "Safety", emoji: "🛡️", color: "var(--t-safety)" },
  environment: { label: "Environment", emoji: "🍃", color: "var(--t-environment)" },
  budget: { label: "Money & fees", emoji: "💵", color: "var(--t-budget)" },
};

export const PERSONAS: Record<Persona, { label: string; emoji: string; who: string }> = {
  renter: { label: "I rent", emoji: "🔑", who: "a renter" },
  homeowner: { label: "I own a home", emoji: "🏡", who: "a homeowner" },
  bus: { label: "I ride the bus", emoji: "🚌", who: "a bus rider" },
  bike: { label: "I bike or walk", emoji: "🚲", who: "someone who bikes and walks" },
  car: { label: "I drive", emoji: "🚗", who: "a driver" },
  student: { label: "I'm a student", emoji: "🎓", who: "a student" },
  parent: { label: "I have kids", emoji: "🧒", who: "a parent" },
  business: { label: "I run a business", emoji: "🏪", who: "a local business owner" },
  senior: { label: "I'm 65+", emoji: "🧓", who: "a senior" },
};

export const NEIGHBORHOODS: Neighborhood[] = ["Downtown", "Eastgate", "Northpark", "Riverside"];

/**
 * What to call things, so a housing society can say "committee" where a city says
 * "council". Write them in lowercase; the app capitalizes them where a sentence starts.
 */
const words = {
  /** The decision-making body: "the council voted". */
  council: "council",
  member: "council member",
  members: "council members",
  meeting: "council meeting",
  /** The name of the original, official wording: "Show council language". */
  officialLanguage: "council language",
  /** Who writes the official agenda: "how the city wrote it". */
  author: "the city",
  /** The whole area: "affect the whole city". */
  area: "city",
  /** Label for items that affect everyone. */
  everywhere: "citywide",
};

/**
 * The wording about this place that appears around the app. To use Ayeline for another
 * city, ward or housing society, change these along with the rest of this file.
 */
export const PLACE = {
  words,
  /** The people who vote, shown in the council chamber. Its size sets the majority. */
  roster,
  /** What every meeting is called and where it happens. */
  meeting: {
    title: "City Council Regular Meeting",
    time: "6:00 PM",
    place: "City Hall Council Chambers, 500 Main St · also streamed online",
  },
  /** Who makes the decisions, as residents would name them. */
  body: `${CITY} City Council`,
  /** Where meetings happen, short enough for one line under the meeting date. */
  venue: "City Hall + online",
  hero: {
    headline: "Your city council decides your rent, your bus and your streets.",
    accent: "Now you can follow along.",
    intro: `Every item on the ${CITY} City Council agenda, rewritten in plain language, with what it means for you and a one-minute way to tell them what you think.`,
  },
  /** Example searches shown in the ⌘K box. */
  searchHint: "rent, buses, Eastgate, parks",
  /** Shown in the footer. */
  note: `${CITY} is a fictional city · Agenda items are modelled on real council agendas`,
  /** The button that sends a comment. */
  sendLabel: "Send to City Council",
  /** Steps for speaking at the meeting in person. {place} and {item} are filled in. */
  inPerson: [
    "Arrive at {place} by 5:45 PM.",
    "Fill out a yellow speaker card and write “{item}”.",
    "You'll get 2 minutes at the microphone when the item comes up.",
  ],
  /** How input reaches the decision-makers, in three steps (My voice). */
  process: [
    { title: "The agenda is posted", body: "About 10 days before each meeting, the city publishes what the council will vote on." },
    {
      title: "Residents comment",
      body: `Written comments go to all ${roster.length} ${words.members}, who read them before voting. You can also speak for 2 minutes at the meeting.`,
    },
    {
      title: "The council votes",
      body: `A majority (${Math.floor(roster.length / 2) + 1} of ${roster.length}) passes an item. Big changes often need two votes, two weeks apart.`,
    },
  ],
};

export const COUNCIL_SIZE = PLACE.roster.length;

/**
 * The isometric map. Each neighborhood is a one-tile square at grid position x, y (leave a
 * gap of about 0.1 between neighbors); `tall` gives it taller buildings. The river, if
 * any, runs across the map between rows `from` and `to`.
 */
export const MAP: {
  districts: Record<Neighborhood, { x: number; y: number; blurb: string; tall?: boolean }>;
  river: { from: number; to: number } | null;
} = {
  districts: {
    Northpark: { x: 0, y: 0, blurb: "Quiet streets, the big park and the university's north campus." },
    Downtown: { x: 1.12, y: 0, blurb: "City Hall, Main Street shops and the busiest bus stops.", tall: true },
    Riverside: { x: 0, y: 1.4, blurb: "Older homes along the river trail and the public pools." },
    Eastgate: { x: 1.12, y: 1.4, blurb: "Big-box stores, new apartments and Eastgate Boulevard." },
  },
  river: { from: 1.06, to: 1.34 },
};

export const MEETINGS: Meeting[] = [
  {
    id: "council-2026-10-21",
    ...PLACE.meeting,
    date: "2026-10-21",
    commentDeadline: "2026-10-20",
  },
  {
    id: "council-2026-11-04",
    ...PLACE.meeting,
    date: "2026-11-04",
    commentDeadline: "2026-11-03",
  },
  {
    id: "council-2026-10-07",
    ...PLACE.meeting,
    date: "2026-10-07",
    commentDeadline: "2026-10-06",
  },
];

export const ITEMS: AgendaItem[] = [
  {
    id: "eastgate-apartments",
    number: "Item 7.A",
    meetingId: "council-2026-10-21",
    topic: "housing",
    title: "Turn the empty Eastgate Kmart lot into 240 apartments, 60 of them affordable",
    officialTitle:
      "Consideration of Ordinance 2026-112 approving a Zone Change from C-2 (General Commercial) to MU-3 (Mixed-Use High Intensity) and a Development Agreement for the property located at 1850 Eastgate Boulevard (APN 042-118-07), including a density bonus pursuant to BMC 17.84",
    officialText:
      "RECOMMENDED ACTION: Conduct a public hearing; introduce and waive first reading of Ordinance 2026-112 approving Zone Change ZC-26-004 from C-2 (General Commercial) to MU-3 (Mixed-Use High Intensity) for the 6.2-acre parcel at 1850 Eastgate Boulevard (APN 042-118-07); approve Development Agreement DA-26-002 with Eastgate Commons LLC providing for 240 residential units, of which 60 units (25%) shall be deed-restricted for households earning at or below 60% of Area Median Income for a period of 55 years; and find the project consistent with the General Plan Housing Element. FISCAL IMPACT: None to the General Fund. Developer shall contribute $1,200,000 toward off-site transportation improvements.",
    summary:
      "A developer wants to build a 6-story apartment complex where the closed Kmart sits on Eastgate Blvd. One in four apartments would have to stay affordable for 55 years. The land is currently only allowed for shops, so the council has to change the zoning first.",
    forYou: {
      renter: "More apartments, especially 60 priced for lower incomes, can help slow rent increases across the city.",
      student: "Affordable units would be open to students who qualify by income, about 10 minutes by bus from campus.",
      senior: "Affordable units must be rented to lower-income households, which includes many people on fixed incomes.",
      car: "Expect about 2 years of construction traffic on Eastgate Blvd. The developer pays for a new traffic light.",
      homeowner: "If you live near Eastgate, a 6-story building will replace an empty parking lot next door.",
    },
    neighborhoods: ["Eastgate"],
    cost: "No city money. The developer pays $1.2M toward a new traffic light and sidewalks.",
    argumentsFor: [
      "Bloomfield is short about 3,000 homes, and rents rose 9% last year.",
      "Turns an empty lot into homes and ground-floor shops.",
      "60 affordable units, locked in for 55 years.",
    ],
    argumentsAgainst: [
      "6 stories is much taller than nearby houses.",
      "Neighbors worry about traffic and street parking.",
      "Some say 25% affordable is too low and want 35%.",
    ],
    timeline: [
      { label: "Proposed by developer", date: "2026-03-02" },
      { label: "Planning Commission recommended it (4–1)", date: "2026-09-10" },
      { label: "Council public hearing + vote", date: "2026-10-21" },
      { label: "Construction could start", date: "2027-06-01" },
    ],
    status: "upcoming",
    comments: { support: 132, oppose: 87 },
  },
  {
    id: "route-9-cuts",
    number: "Item 9.C",
    meetingId: "council-2026-10-21",
    topic: "transit",
    title: "Weekend buses on Route 9 would come every 30 minutes instead of every 15",
    officialTitle:
      "Adoption of Resolution 2026-381 approving the FY2027 Transit Service Plan, including service-level adjustments to Routes 4, 9 and 12 as described in Exhibit B",
    officialText:
      "RECOMMENDED ACTION: Adopt Resolution 2026-381 approving the FY2027 Transit Service Plan. Exhibit B reflects headway adjustments on Route 9 (Northpark–Downtown–University) from 15-minute to 30-minute frequency on Saturdays, Sundays and holidays, and the consolidation of Routes 4 and 12 between 9:00 PM and service end. FISCAL IMPACT: Projected annual operating savings of $640,000, addressing a portion of the projected $2.1M transit operating shortfall resulting from the expiration of federal relief funding.",
    summary:
      "The city's bus budget is short $2.1M because federal pandemic money ran out. To save $640K a year, weekend buses on Route 9 (Northpark to Downtown to the university) would run half as often, and two late-night routes would be merged.",
    forYou: {
      bus: "If you ride Route 9 on weekends, you could wait up to 30 minutes instead of 15.",
      student: "Route 9 is the main weekend bus to campus. Trips could take up to 15 minutes longer.",
      senior: "Longer waits at stops, with fewer buses on Saturdays, Sundays and holidays.",
    },
    neighborhoods: ["Northpark", "Downtown"],
    cost: "Saves $640,000 a year.",
    argumentsFor: [
      "Weekend buses on Route 9 are about half full on average.",
      "Cutting service is cheaper than raising fares for everyone.",
    ],
    argumentsAgainst: [
      "Weekend riders are often shift workers and students with no other option.",
      "Less frequent buses tend to lose more riders over time.",
      "Other cities have filled gaps with parking revenue instead.",
    ],
    timeline: [
      { label: "Transit agency proposed cuts", date: "2026-08-15" },
      { label: "Transit Committee review", date: "2026-09-24" },
      { label: "Council vote", date: "2026-10-21" },
      { label: "New schedule would start", date: "2027-01-10" },
    ],
    status: "upcoming",
    comments: { support: 41, oppose: 203 },
  },
  {
    id: "elm-street",
    number: "Item 6.B",
    meetingId: "council-2026-10-21",
    topic: "streets",
    title: "Spend $412K more to finish the design for protected bike lanes on Elm Street",
    officialTitle:
      "Authorization of Amendment No. 2 to the Professional Services Agreement with Kessler Engineering Group for the Elm Street Corridor Multimodal Improvement Project, increasing compensation by $412,000 for a total not-to-exceed amount of $1,890,000",
    officialText:
      "RECOMMENDED ACTION: Authorize the City Manager to execute Amendment No. 2 to Professional Services Agreement PSA-24-031 with Kessler Engineering Group for final design and construction documents for the Elm Street Corridor Multimodal Improvement Project (2nd Avenue to Riverside Drive), increasing compensation by $412,000 for a total not-to-exceed amount of $1,890,000. The preferred alternative includes Class IV separated bikeways, sidewalk widening, and the removal of 38 on-street parking spaces. FISCAL IMPACT: Funded by the state Active Transportation Program grant (88%) and Measure T local match (12%).",
    summary:
      "Elm Street would get bike lanes separated from cars by curbs, plus wider sidewalks, from 2nd Ave to Riverside Dr. This vote pays engineers to finish the plans. Most of the money comes from a state grant. 38 street parking spots would go.",
    forYou: {
      bike: "A curb-protected bike lane through Downtown, the first in Bloomfield.",
      car: "38 street parking spots on Elm would be removed. Expect about 8 months of construction from spring 2027.",
      business: "If your shop is on Elm, construction and lost parking may affect customers for a while.",
      student: "A safer bike route from Downtown to campus.",
      bus: "Wider sidewalks at Elm Street bus stops.",
    },
    neighborhoods: ["Downtown"],
    cost: "$412,000, mostly paid by a state grant (88%).",
    argumentsFor: [
      "Elm St had 23 crashes involving cyclists or pedestrians in 3 years.",
      "The state grant would be lost if the project stalls.",
    ],
    argumentsAgainst: [
      "Downtown businesses worry about losing parking.",
      "The design cost has grown by about 30% since 2024.",
    ],
    timeline: [
      { label: "Project started", date: "2024-05-01" },
      { label: "Community workshops", date: "2025-11-12" },
      { label: "Council vote on design contract", date: "2026-10-21" },
      { label: "Construction would start", date: "2027-04-01" },
    ],
    status: "upcoming",
    comments: { support: 96, oppose: 58 },
  },
  {
    id: "security-deposits",
    number: "Item 8.A",
    meetingId: "council-2026-11-04",
    topic: "housing",
    title: "Limit security deposits to one month's rent, and make landlords explain any deductions",
    officialTitle:
      "Second Reading and Adoption of Ordinance 2026-118 amending Chapter 5.70 of the Bloomfield Municipal Code (Residential Tenant Protections) to establish limitations on security deposit amounts and require itemized deduction statements",
    officialText:
      "RECOMMENDED ACTION: Conduct second reading and adopt Ordinance 2026-118 amending BMC Chapter 5.70 to (a) limit security deposits for residential tenancies to an amount not exceeding one month's rent, exclusive of a pet deposit not exceeding $300; (b) require landlords to provide an itemized statement of deductions, with supporting receipts for any deduction exceeding $125, within 21 days of the termination of tenancy; and (c) establish a penalty of up to twice the amount of the deposit for bad-faith retention. FISCAL IMPACT: Minimal; administered by the Housing Division within existing resources.",
    summary:
      "Landlords could charge a deposit of no more than one month's rent (plus up to $300 for a pet). When you move out, they would have 21 days to give you a written list of anything they keep money for, with receipts.",
    forYou: {
      renter: "Moving in would cost less upfront, and it would be easier to get your deposit back when you leave.",
      student: "Many students pay two months' deposit today. This would cap it at one.",
      homeowner: "If you rent out a unit, you would need receipts for deductions over $125.",
    },
    neighborhoods: "citywide",
    cost: "No new cost to the city.",
    argumentsFor: [
      "Moving costs often add up to 3 months' rent at once.",
      "Deposit disputes are the #1 complaint to the city's housing line.",
    ],
    argumentsAgainst: [
      "Small landlords say one month doesn't cover major damage.",
      "Could lead landlords to screen tenants more strictly.",
    ],
    timeline: [
      { label: "Proposed by Councilmember Ortiz", date: "2026-07-08" },
      { label: "First vote passed (5–2)", date: "2026-10-07" },
      { label: "Final vote", date: "2026-11-04" },
      { label: "Would take effect", date: "2027-01-01" },
    ],
    status: "upcoming",
    comments: { support: 211, oppose: 34 },
  },
  {
    id: "school-speed-cameras",
    number: "Item 11.A",
    meetingId: "council-2026-11-04",
    topic: "safety",
    title: "Put speed cameras outside 5 elementary schools for a 2-year trial",
    officialTitle:
      "Approval of an Agreement with Veridian Traffic Systems, Inc. for the installation and operation of an Automated Speed Enforcement Pilot Program in designated School Zones pursuant to Vehicle Code Section 22425",
    officialText:
      "RECOMMENDED ACTION: Approve a 24-month agreement with Veridian Traffic Systems, Inc. for the installation, operation and maintenance of Automated Speed Enforcement (ASE) systems at up to five (5) school zone locations identified in Attachment A, with citations issued for speeds of 11 MPH or more above the posted limit. Captured images shall be retained no longer than 60 days unless associated with a contested citation, and shall not be used for any purpose other than speed enforcement. FISCAL IMPACT: Vendor costs to be recovered from citation revenue; no General Fund impact anticipated.",
    summary:
      "Cameras would ticket drivers going 11+ mph over the limit near 5 elementary schools. The company running them gets paid from the fines. Photos must be deleted after 60 days unless someone fights the ticket.",
    forYou: {
      parent: "Cameras near Lincoln, Hawthorne, Riverside, Eastgate and Northpark Elementary.",
      car: "Tickets start at $50 for going 11–15 mph over the limit in a school zone.",
      bike: "Slower traffic near schools makes walking and biking safer for kids.",
    },
    neighborhoods: "citywide",
    cost: "No city money. Paid from ticket fines.",
    argumentsFor: [
      "Cities with school-zone cameras saw speeding drop by over 50%.",
      "Fines are lower than a police ticket and don't add license points.",
    ],
    argumentsAgainst: [
      "Privacy groups worry about cameras collecting data.",
      "Paying the vendor from fines may create the wrong incentives.",
    ],
    timeline: [
      { label: "Requested by school safety task force", date: "2026-04-20" },
      { label: "Public Safety Committee review", date: "2026-09-30" },
      { label: "Council vote", date: "2026-11-04" },
      { label: "Cameras would turn on", date: "2027-02-01" },
    ],
    status: "upcoming",
    comments: { support: 77, oppose: 69 },
  },
  {
    id: "pool-hours",
    number: "Item 10.D",
    meetingId: "council-2026-10-21",
    topic: "parks",
    title: "Keep two public pools open until 9 PM next summer",
    officialTitle:
      "Approval of a Budget Appropriation of $185,000 from the General Fund Unassigned Balance to the Parks and Recreation Department for extended aquatics operations, FY2027",
    officialText:
      "RECOMMENDED ACTION: Approve a budget appropriation of $185,000 from the General Fund Unassigned Balance to Parks and Recreation account 101-4410-5120 to extend operating hours at Riverside Aquatic Center and Northpark Pool to 9:00 PM daily between June 15 and August 31, 2027, including seasonal lifeguard staffing. FISCAL IMPACT: $185,000 one-time from General Fund reserves.",
    summary:
      "Riverside and Northpark pools close at 6 PM today. This would keep them open until 9 PM every day from mid-June to the end of August, using money from the city's savings to hire more lifeguards.",
    forYou: {
      parent: "Evening swim time after work and summer camp, at both city pools.",
      student: "About 40 more summer lifeguard jobs.",
      senior: "Cooler evening hours for lap swimming during heat waves.",
    },
    neighborhoods: ["Riverside", "Northpark"],
    cost: "$185,000 one time, from city savings.",
    argumentsFor: ["Pools are full by 2 PM on hot days.", "Gives teens a safe place to be in the evenings."],
    argumentsAgainst: ["Uses savings during a tight budget year.", "May be hard to hire enough lifeguards."],
    timeline: [
      { label: "Requested by Parks Commission", date: "2026-08-04" },
      { label: "Council vote", date: "2026-10-21" },
      { label: "Longer hours would start", date: "2027-06-15" },
    ],
    status: "upcoming",
    comments: { support: 158, oppose: 12 },
  },
  {
    id: "parking-meters",
    number: "Item 9.A",
    meetingId: "council-2026-10-21",
    topic: "budget",
    title: "Downtown parking meters go from $1.50 to $2.50 an hour, and run until 8 PM",
    officialTitle:
      "Adoption of Resolution 2026-379 amending the Master Fee Schedule to adjust On-Street Parking Meter Rates within the Downtown Parking Benefit District and extend enforcement hours",
    officialText:
      "RECOMMENDED ACTION: Adopt Resolution 2026-379 amending the Master Fee Schedule to increase on-street meter rates within the Downtown Parking Benefit District from $1.50 to $2.50 per hour and extend enforcement hours from 6:00 PM to 8:00 PM, Monday through Saturday. Net new revenue shall be reinvested within the District for sidewalk, lighting and streetscape improvements. FISCAL IMPACT: Estimated net new revenue of $900,000 annually to the Downtown Parking Benefit District fund.",
    summary:
      "Parking downtown would cost $1 more an hour, and you'd have to pay until 8 PM instead of 6 PM. The extra money (about $900K a year) can only be spent on downtown sidewalks, lighting and streets.",
    forYou: {
      car: "A 2-hour dinner downtown would cost $5 in parking instead of $0 after 6 PM.",
      business: "Customers may find parking easier, but some may shop elsewhere.",
      student: "Evening parking near downtown bars and venues would no longer be free.",
    },
    neighborhoods: ["Downtown"],
    cost: "Raises about $900,000 a year for downtown improvements.",
    argumentsFor: [
      "Downtown blocks are over 90% full at peak times.",
      "Money stays downtown for lighting and sidewalks.",
    ],
    argumentsAgainst: ["Hurts lower-income workers who drive to evening shifts.", "Some businesses fear losing customers."],
    timeline: [
      { label: "Downtown parking study", date: "2026-05-15" },
      { label: "Council vote", date: "2026-10-21" },
      { label: "New rates would start", date: "2027-01-02" },
    ],
    status: "upcoming",
    comments: { support: 38, oppose: 121 },
  },
  {
    id: "leaf-blowers",
    number: "Item 12.B",
    meetingId: "council-2026-11-04",
    topic: "environment",
    title: "Phase out gas-powered leaf blowers by 2028, with rebates for electric ones",
    officialTitle:
      "Introduction of Ordinance 2026-121 adding Chapter 8.46 to the Bloomfield Municipal Code regulating the use of Gas-Powered Landscape Maintenance Equipment, with a phased compliance schedule and equipment exchange rebate program",
    officialText:
      "RECOMMENDED ACTION: Introduce Ordinance 2026-121 adding BMC Chapter 8.46 prohibiting the operation of gas-powered leaf blowers within city limits effective January 1, 2028, and appropriating $250,000 from the Climate Action Fund for an equipment exchange rebate program prioritizing small landscaping businesses. FISCAL IMPACT: $250,000 one-time from the Climate Action Fund.",
    summary:
      "Gas leaf blowers would be banned starting January 2028. A $250K rebate program would help, especially small landscaping companies, buy electric ones.",
    forYou: {
      homeowner: "Quieter mornings. If you own a gas blower, you could get a rebate to switch.",
      business: "Landscaping businesses get first access to rebates for electric equipment.",
      senior: "Less noise and exhaust in residential neighborhoods.",
    },
    neighborhoods: "citywide",
    cost: "$250,000 one time, from the Climate Action Fund.",
    argumentsFor: [
      "One hour of a gas blower pollutes like driving about 1,100 miles.",
      "Noise is the top complaint to code enforcement.",
    ],
    argumentsAgainst: [
      "Electric equipment and batteries cost small crews thousands of dollars.",
      "Some worry electric tools aren't strong enough for big jobs.",
    ],
    timeline: [
      { label: "Proposed in Climate Action Plan", date: "2025-12-01" },
      { label: "First council vote", date: "2026-11-04" },
      { label: "Ban would start", date: "2028-01-01" },
    ],
    status: "upcoming",
    comments: { support: 64, oppose: 45 },
  },
  {
    id: "youth-bus-pass",
    number: "Item 9.D",
    meetingId: "council-2026-11-04",
    topic: "transit",
    title: "Free bus rides for everyone under 18",
    officialTitle:
      "Approval of a Memorandum of Understanding with Bloomfield Unified School District and Bloomfield Transit Authority for the Youth Transit Pass Program, FY2027–FY2028",
    officialText:
      "RECOMMENDED ACTION: Approve a Memorandum of Understanding among the City, Bloomfield Unified School District (BUSD) and Bloomfield Transit Authority (BTA) establishing a two-year Youth Transit Pass Program providing fare-free transit for riders aged 5 through 17. FISCAL IMPACT: $310,000 annually, shared 50% City General Fund and 50% BUSD.",
    summary:
      "Kids and teens aged 5 to 17 would ride all city buses for free for 2 years. The city and the school district would split the $310K yearly cost.",
    forYou: {
      parent: "Your kids could ride the bus to school, practice or a job for free. That saves about $45 a month per teen.",
      bus: "More young riders on buses, especially before and after school.",
    },
    neighborhoods: "citywide",
    cost: "$310,000 a year, split with the school district.",
    argumentsFor: ["Helps families who can't drive kids everywhere.", "Builds bus habits early."],
    argumentsAgainst: ["Comes during a transit budget shortfall.", "Crowding on school-hour routes."],
    timeline: [
      { label: "Proposed by Youth Commission", date: "2026-06-10" },
      { label: "Council vote", date: "2026-11-04" },
      { label: "Free rides would start", date: "2027-01-10" },
    ],
    status: "upcoming",
    comments: { support: 143, oppose: 22 },
  },
  {
    id: "relocation-help",
    number: "Item 8.B",
    meetingId: "council-2026-10-07",
    topic: "housing",
    title: "Renters get moving help if their building is torn down",
    officialTitle:
      "Adoption of Ordinance 2026-109 establishing Tenant Relocation Assistance requirements for no-fault terminations due to demolition or substantial remodel",
    officialText:
      "Adopt Ordinance 2026-109 requiring owners terminating a residential tenancy for demolition or substantial remodel to provide relocation assistance equal to two months' rent and 90 days' written notice.",
    summary:
      "If your landlord ends your lease to tear down or fully remodel the building, they must give you 90 days' notice and two months' rent to help you move.",
    forYou: { renter: "You're protected if your building is torn down: 90 days' notice and two months' rent." },
    neighborhoods: "citywide",
    cost: "No city money.",
    argumentsFor: ["Displacement from redevelopment is rising."],
    argumentsAgainst: ["Adds costs to new housing projects."],
    timeline: [
      { label: "Proposed", date: "2026-05-12" },
      { label: "Council vote", date: "2026-10-07" },
      { label: "Takes effect", date: "2026-11-06" },
    ],
    status: "passed",
    result: { yes: 6, no: 1, nextStep: "Takes effect on Nov 6, 2026. Landlords must follow it for any notice sent after that date." },
    comments: { support: 188, oppose: 40 },
  },
  {
    id: "northpark-dog-park",
    number: "Item 10.A",
    meetingId: "council-2026-10-07",
    topic: "parks",
    title: "Build a fenced dog park in Northpark",
    officialTitle:
      "Award of Construction Contract to Greenline Builders for the Northpark Off-Leash Dog Area Project in the amount of $342,800",
    officialText:
      "Award a construction contract to Greenline Builders, lowest responsive bidder, in the amount of $342,800 for the Northpark Off-Leash Dog Area Project, funded by Park Development Impact Fees.",
    summary: "A fenced, off-leash dog park with shade and water fountains is coming to Northpark Community Park.",
    forYou: { homeowner: "Opens in spring 2027 at Northpark Community Park." },
    neighborhoods: ["Northpark"],
    cost: "$342,800 from developer park fees.",
    argumentsFor: ["Most-requested park feature in the city survey."],
    argumentsAgainst: ["Some neighbors worry about noise."],
    timeline: [
      { label: "Council vote", date: "2026-10-07" },
      { label: "Opens", date: "2027-04-01" },
    ],
    status: "passed",
    result: { yes: 7, no: 0, nextStep: "Construction starts in January. Expected to open in April 2027." },
    comments: { support: 97, oppose: 9 },
  },
  {
    id: "car-free-main",
    number: "Item 6.A",
    meetingId: "council-2026-10-07",
    topic: "streets",
    title: "Close 4 blocks of Main Street to cars on Saturdays",
    officialTitle:
      "Approval of a 12-month Pilot Program for Weekly Temporary Street Closures of Main Street between 1st and 5th Avenues for pedestrian use",
    officialText:
      "Approve a 12-month pilot program closing Main Street between 1st and 5th Avenues to vehicular traffic Saturdays 10:00 AM to 6:00 PM for pedestrian, vendor and outdoor dining use.",
    summary: "Main Street between 1st and 5th would have been car-free on Saturdays for a one-year trial.",
    forYou: { business: "The trial won't happen for now." },
    neighborhoods: ["Downtown"],
    cost: "$60,000 for barriers and staff.",
    argumentsFor: ["Similar trials boosted foot traffic in other cities."],
    argumentsAgainst: ["Some businesses worried about deliveries and access."],
    timeline: [{ label: "Council vote", date: "2026-10-07" }],
    status: "failed",
    result: {
      yes: 3,
      no: 4,
      nextStep: "Did not pass. Council asked staff to come back with a smaller trial (2 blocks) in spring.",
    },
    comments: { support: 154, oppose: 131 },
  },
];

export function meetingFor(item: AgendaItem): Meeting {
  return MEETINGS.find((m) => m.id === item.meetingId)!;
}

/* ---------- Community: city notices and service requests ---------- */

/**
 * The everyday side of the city: events and alerts posted by the city, and a service desk
 * where residents report problems (a pothole, a dark streetlight) that city crews then fix
 * in the order they were reported.
 */
export const COMMUNITY = {
  /** Who posts notices and runs the service desk. */
  office: `City of ${CITY}`,
  desk: `${CITY} 311`,
  /** What to call a crew member's unit, and the field residents fill in. */
  crewLabel: "crew",
  locationLabel: "Street address or nearest landmark",
  locationExample: "Elm St & 2nd Ave",
};

export type NoticeKind = "festival" | "sports" | "alert" | "meeting";
/** The animated art on a notice's card. */
export type NoticeArt = "diya" | "snow" | "fireworks" | "shuttle" | "water" | "plain";

export interface Notice {
  id: string;
  kind: NoticeKind;
  art: NoticeArt;
  emoji: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  /** Where in the city, for the "near you" hint. */
  neighborhoods: Neighborhood[] | "citywide";
  body: string;
  /** People already going, before this resident. 0 hides RSVP (e.g. alerts). */
  going: number;
  /** Optional extra details, one per line. */
  details?: string[];
}

export const NOTICE_KINDS: Record<NoticeKind, { label: string; color: string }> = {
  festival: { label: "Festival", color: "var(--accent)" },
  sports: { label: "Sports", color: "var(--glow)" },
  alert: { label: "Alert", color: "var(--coral)" },
  meeting: { label: "Town hall", color: "var(--lilac)" },
};

export const NOTICES: Notice[] = [
  {
    id: "eastgate-water-main",
    kind: "alert",
    art: "water",
    emoji: "🚱",
    title: "No water in parts of Eastgate on Friday, 10 AM to 2 PM",
    date: "2026-10-16",
    time: "10:00 AM – 2:00 PM",
    venue: "Eastgate Blvd between 12th and 18th St",
    neighborhoods: ["Eastgate"],
    body: "Crews are replacing a water main. Store enough water on Thursday night. Expect lane closures on Eastgate Blvd until 4 PM.",
    going: 0,
  },
  {
    id: "dussehra-mela",
    kind: "festival",
    art: "diya",
    emoji: "🪔",
    title: "Dussehra mela and Ravan dahan at Riverside Park",
    date: "2026-10-20",
    time: "5:00 PM",
    venue: "Riverside Park, main meadow",
    neighborhoods: ["Riverside"],
    body: "The city's Dussehra celebration with food stalls, garba, a kids' craft tent and the Ravan dahan by the river at dusk. Free entry.",
    going: 1460,
    details: ["Ravan dahan at 7:30 PM", "Free shuttle buses from Downtown every 15 minutes", "Street parking closed on River Rd from 3 PM"],
  },
  {
    id: "bloomfield-open-badminton",
    kind: "sports",
    art: "shuttle",
    emoji: "🏸",
    title: "Bloomfield Open badminton tournament",
    date: "2026-11-07",
    time: "8:00 AM",
    venue: "Northpark Recreation Center",
    neighborhoods: ["Northpark"],
    body: "Singles and doubles for under-14, adults and 50+, run by Parks & Recreation. Spectators welcome, and finals are on Sunday morning.",
    going: 380,
    details: ["Register at any rec center by Nov 3", "Rackets available to borrow", "Trophies in every category"],
  },
  {
    id: "budget-town-hall",
    kind: "meeting",
    art: "plain",
    emoji: "🗳️",
    title: "Town hall on next year's city budget",
    date: "2026-11-15",
    time: "11:00 AM",
    venue: "City Hall, Council Chambers",
    neighborhoods: "citywide",
    body: "The city manager walks through next year's budget, then takes questions. Streamed online, with Spanish and Hindi interpretation.",
    going: 240,
  },
  {
    id: "tree-lighting",
    kind: "festival",
    art: "snow",
    emoji: "🎄",
    title: "Christmas Eve carols and tree lighting at City Hall",
    date: "2026-12-24",
    time: "6:00 PM",
    venue: "City Hall plaza",
    neighborhoods: ["Downtown"],
    body: "Community choirs, the lighting of the city tree, and hot chocolate from Main Street businesses. Santa's on the steps until 8 PM.",
    going: 890,
    details: ["Toy drive: drop new toys at any fire station by Dec 20", "Main St closed to cars from 4 PM"],
  },
  {
    id: "new-year-fireworks",
    kind: "festival",
    art: "fireworks",
    emoji: "🎆",
    title: "New Year's Eve fireworks over the river",
    date: "2026-12-31",
    time: "9:00 PM",
    venue: "Riverfront, Riverside to Downtown",
    neighborhoods: ["Riverside", "Downtown"],
    body: "Live music on the riverfront stage, food trucks and the midnight fireworks. Buses run free all night.",
    going: 4120,
    details: ["Best views from the River Rd bridge", "Free buses on every route from 8 PM to 3 AM", "Family zone with an early 9 PM show"],
  },
];

export interface Service {
  id: string;
  label: string;
  emoji: string;
  /** Typical time a crew spends on one job. */
  minutes: number;
  /** Crews that handle this kind of request, so several can run at once. */
  team: string[];
  /** Short request prefix, e.g. "PT" for PT-07. */
  code: string;
  note: string;
}

export const SERVICES: Service[] = [
  { id: "pothole", label: "Pothole", emoji: "🕳️", minutes: 90, team: ["Road crew 2", "Road crew 5"], code: "PT", note: "Holes and broken pavement on city streets" },
  { id: "streetlight", label: "Streetlight out", emoji: "💡", minutes: 45, team: ["Electric crew 1"], code: "SL", note: "Dark, flickering or damaged streetlights" },
  { id: "garbage", label: "Missed garbage pickup", emoji: "🗑️", minutes: 30, team: ["Truck 4", "Truck 9"], code: "GB", note: "Trash, recycling or compost bins that were skipped" },
  { id: "tree", label: "Fallen tree or branch", emoji: "🌳", minutes: 120, team: ["Forestry crew"], code: "TR", note: "Blocking a road, sidewalk or power line" },
  { id: "leak", label: "Water leak", emoji: "💧", minutes: 60, team: ["Water crew 3"], code: "WL", note: "Water bubbling up from the street or a hydrant" },
  { id: "drain", label: "Blocked storm drain", emoji: "🌧️", minutes: 40, team: ["Road crew 2"], code: "DR", note: "Flooding at a drain or curb" },
  { id: "graffiti", label: "Graffiti", emoji: "🎨", minutes: 50, team: ["Clean team"], code: "GR", note: "On public walls, signs and bus shelters" },
  { id: "signal", label: "Traffic signal problem", emoji: "🚦", minutes: 40, team: ["Signal crew"], code: "TS", note: "Lights stuck, out, or timed badly" },
];

export type JobStatus = "queued" | "visiting" | "done" | "cancelled";

export interface Job {
  id: string;
  service: string;
  /** Street address or landmark. */
  location: string;
  neighborhood: Neighborhood;
  note: string;
  /** Position in that service's line, in order of reporting. */
  token: number;
  status: JobStatus;
  /** Which crew is on it, once dispatched. */
  staff?: string;
  mine: boolean;
  /** Whether there's a photo this viewer may see (the reporter and city staff only). */
  photo?: boolean;
}

/** Other residents' reports already in the queues, so the demo starts with a working service desk. */
export const SEED_JOBS: Job[] = [
  { id: "s1", service: "pothole", location: "Eastgate Blvd & 14th St", neighborhood: "Eastgate", note: "", token: 4, status: "visiting", staff: "Road crew 2", mine: false },
  { id: "s2", service: "pothole", location: "Main St outside the library", neighborhood: "Downtown", note: "", token: 5, status: "visiting", staff: "Road crew 5", mine: false },
  { id: "s3", service: "pothole", location: "Oak Ave & River Rd", neighborhood: "Riverside", note: "", token: 6, status: "queued", mine: false },
  { id: "s4", service: "pothole", location: "University Dr bus stop", neighborhood: "Northpark", note: "", token: 7, status: "queued", mine: false },
  { id: "s5", service: "streetlight", location: "Park Ln near the playground", neighborhood: "Northpark", note: "", token: 2, status: "visiting", staff: "Electric crew 1", mine: false },
  { id: "s6", service: "streetlight", location: "Elm St & 2nd Ave", neighborhood: "Downtown", note: "", token: 3, status: "queued", mine: false },
  { id: "s7", service: "garbage", location: "300 block of Cedar St", neighborhood: "Riverside", note: "", token: 9, status: "visiting", staff: "Truck 4", mine: false },
  { id: "s8", service: "garbage", location: "Willow Ct", neighborhood: "Eastgate", note: "", token: 10, status: "queued", mine: false },
  { id: "s9", service: "tree", location: "River trail near the boathouse", neighborhood: "Riverside", note: "", token: 3, status: "queued", mine: false },
  { id: "s10", service: "signal", location: "Eastgate Blvd & 6th St", neighborhood: "Eastgate", note: "", token: 1, status: "visiting", staff: "Signal crew", mine: false },
];
