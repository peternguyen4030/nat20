import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.STORAGE_PRISMA_DATABASE_URL;
if (!connectionString) throw new Error("Missing STORAGE_PRISMA_DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

const backgrounds = [
  {
    index:              "acolyte",
    name:               "Acolyte",
    description:        "You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices in order to conduct worshipers into the presence of the divine.",
    feature:            "Shelter of the Faithful",
    skillProficiencies: ["Insight", "Religion"],
    languages:          2,
  },
  {
    index:              "charlatan",
    name:               "Charlatan",
    description:        "You have always had a talent for making people believe what you want them to believe, whether it's that your newest potion will cure their ills or that you're the grand duke's personal representative. You're a consummate liar who knows how to use charm and misdirection to get ahead.",
    feature:            "False Identity",
    skillProficiencies: ["Deception", "Sleight of Hand"],
    languages:          0,
  },
  {
    index:              "criminal",
    name:               "Criminal",
    description:        "You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld. You're far closer than most people to the world of murder, theft, and violence that pervades the underbelly of civilization.",
    feature:            "Criminal Contact",
    skillProficiencies: ["Deception", "Stealth"],
    languages:          0,
  },
  {
    index:              "entertainer",
    name:               "Entertainer",
    description:        "You thrive in front of an audience. You know how to entrance them, entertain them, and even inspire them. Your poetics can stir the hearts of those who hear you, awakening grief or joy, laughter or anger. Your music raises their spirits or captures their sorrow. Your dance steps captivate, your humor cuts to the quick.",
    feature:            "By Popular Demand",
    skillProficiencies: ["Acrobatics", "Performance"],
    languages:          0,
  },
  {
    index:              "folk-hero",
    name:               "Folk Hero",
    description:        "You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk everywhere.",
    feature:            "Rustic Hospitality",
    skillProficiencies: ["Animal Handling", "Survival"],
    languages:          0,
  },
  {
    index:              "guild-artisan",
    name:               "Guild Artisan",
    description:        "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans. You are a well-established part of the mercantile world, freed by talent and wealth from the constraints of a feudal social order. You learned your skills as an apprentice to a master artisan, under the sponsorship of your guild.",
    feature:            "Guild Membership",
    skillProficiencies: ["Insight", "Persuasion"],
    languages:          1,
  },
  {
    index:              "hermit",
    name:               "Hermit",
    description:        "You lived in seclusion — either in a sheltered community such as a monastery, or entirely alone — for a formative part of your life. In your time apart from the clamor of society, you found quiet, solitude, and perhaps some of the answers you were looking for.",
    feature:            "Discovery",
    skillProficiencies: ["Medicine", "Religion"],
    languages:          1,
  },
  {
    index:              "noble",
    name:               "Noble",
    description:        "You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence. You might be a pampered aristocrat unfamiliar with work or discomfort, a former merchant just elevated to the nobility, or a disinherited scoundrel with a disproportionate sense of entitlement.",
    feature:            "Position of Privilege",
    skillProficiencies: ["History", "Persuasion"],
    languages:          1,
  },
  {
    index:              "outlander",
    name:               "Outlander",
    description:        "You grew up in the wilds, far from civilization and the comforts of town and technology. You've witnessed the migration of herds larger than forests, survived weather more extreme than any city-dweller could comprehend, and enjoyed the solitude of being the only thinking creature for miles in any direction.",
    feature:            "Wanderer",
    skillProficiencies: ["Athletics", "Survival"],
    languages:          1,
  },
  {
    index:              "sage",
    name:               "Sage",
    description:        "You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you. Your efforts have made you a master in your fields of study.",
    feature:            "Researcher",
    skillProficiencies: ["Arcana", "History"],
    languages:          2,
  },
  {
    index:              "sailor",
    name:               "Sailor",
    description:        "You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, monsters of the deep, and those who wanted to sink your craft to the bottomless depths. Your first love is the distant line of the horizon, but the time has come to try your hand at something new.",
    feature:            "Ship's Passage",
    skillProficiencies: ["Athletics", "Perception"],
    languages:          0,
  },
  {
    index:              "soldier",
    name:               "Soldier",
    description:        "War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield. You might have been part of a standing national army or a mercenary company, or perhaps a member of a local militia who rose to prominence during a recent war.",
    feature:            "Military Rank",
    skillProficiencies: ["Athletics", "Intimidation"],
    languages:          0,
  },
  {
    index:              "urchin",
    name:               "Urchin",
    description:        "You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or to provide for you, so you learned to provide for yourself. You fought fiercely over food and kept a constant watch out for other desperate souls who might steal from you. You slept on rooftops and in alleyways, exposed to the elements, and endured sickness without the advantage of medicine or a place to recuperate.",
    feature:            "City Secrets",
    skillProficiencies: ["Sleight of Hand", "Stealth"],
    languages:          0,
  },
  {
    index:              "haunted-one",
    name:               "Haunted One",
    description:        "You are haunted by something so terrible that you dare not speak of it. You've tried to bury it and run away from it, to no avail. Whatever this thing is that haunts you, it can't be slain with a sword or banished with a spell. It might come to you as a shadow on the wall, a bloodcurdling nightmare, a memory that refuses to die, or a demonic whisper in the dark.",
    feature:            "Heart of Darkness",
    skillProficiencies: ["Arcana", "Investigation"],
    languages:          2,
  },
  {
    index:              "knight",
    name:               "Knight",
    description:        "A variant of the noble background, you are a knight who has sworn an oath of service to a liege lord, a deity, or some other cause. Unlike the typical noble, you receive the Retainers feature instead of the Position of Privilege feature, representing the attendants and squires that accompany you.",
    feature:            "Retainers",
    skillProficiencies: ["History", "Persuasion"],
    languages:          1,
  },
  {
    index:              "pirate",
    name:               "Pirate",
    description:        "A variant of the sailor background, you spent your years before adventuring as a pirate — a scoundrel by the law's reckoning, but perhaps a free spirit by your own. You have a criminal reputation and have made enemies along the coast, but you've also got a crew of loyal cutthroats and a network of fences and black-market dealers.",
    feature:            "Bad Reputation",
    skillProficiencies: ["Athletics", "Perception"],
    languages:          0,
  },
  {
    index:              "spy",
    name:               "Spy",
    description:        "A variant of the criminal background, although you have been trained in the same skills as a criminal, you apply them in service to a noble house, a government, or a spy network. You are an expert at gathering information that others want kept secret, and you know how to use that information to your advantage.",
    feature:            "Criminal Contact",
    skillProficiencies: ["Deception", "Stealth"],
    languages:          0,
  },
  {
    index:              "gladiator",
    name:               "Gladiator",
    description:        "A variant of the entertainer background, you have performed in the arena as a gladiator, and the crowds love you for it. You might have been a slave forced to fight for the amusement of the wealthy, a soldier who discovered a talent for showmanship, or a free warrior who revels in combat and the adoration of the crowd.",
    feature:            "By Popular Demand",
    skillProficiencies: ["Acrobatics", "Performance"],
    languages:          0,
  },
];

async function main() {
  console.log("🎲 Seeding backgrounds...\n");
  let created = 0;
  let updated = 0;

  for (const bg of backgrounds) {
    const existing = await prisma.background.findUnique({ where: { index: bg.index } });
    if (existing) {
      await prisma.background.update({ where: { index: bg.index }, data: bg });
      console.log(`  ↻ Updated  — ${bg.name}`);
      updated++;
    } else {
      await prisma.background.create({ data: bg });
      console.log(`  ✦ Created  — ${bg.name}`);
      created++;
    }
  }

  console.log(`\n✓ Done — ${created} created, ${updated} updated`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());