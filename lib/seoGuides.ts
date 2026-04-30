import type { Metadata } from 'next';
import {
  SEO_LAST_REVIEWED,
  buildPageMetadata,
  type FaqItem
} from '@/lib/seo';

export type SeoGuideSlug =
  | 'california-car-accident-settlement-factors'
  | 'california-whiplash-settlement-calculator'
  | 'california-car-accident-pain-and-suffering-calculator'
  | 'california-comparative-fault-car-accident-settlements'
  | 'california-car-accident-settlement-timeline'
  | 'california-car-accident-medical-bills-and-liens'
  | 'california-auto-injury-settlement-by-county'
  | 'california-car-accident-settlement-faq';

export interface GuideSource {
  label: string;
  href: string;
}

export interface GuideComparison {
  columns: [string, string, string];
  rows: [string, string, string][];
}

export interface SeoGuide {
  slug: SeoGuideSlug;
  title: string;
  metaTitle: string;
  description: string;
  directAnswer: string;
  byline: string;
  lastReviewed: string;
  takeaways: string[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  comparison: GuideComparison;
  calculatorUse: string;
  faqs: FaqItem[];
  sources: GuideSource[];
  related: SeoGuideSlug[];
  keywords: string[];
}

const sharedSources: GuideSource[] = [
  {
    label: 'California Courts Self-Help Guide: Personal injury cases',
    href: 'https://selfhelp.courts.ca.gov/civil-lawsuit/personal-injury'
  },
  {
    label: 'California Courts Self-Help Guide: Deadlines to sue someone',
    href: 'https://selfhelp.courts.ca.gov/civil-lawsuit/statute-limitations'
  },
  {
    label: 'California Code of Civil Procedure section 335.1',
    href: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=335.1'
  },
  {
    label: 'California DMV: Auto insurance requirements',
    href: 'https://www.dmv.ca.gov/portal/vehicle-registration/insurance-requirements/'
  },
  {
    label: 'DHCS Personal Injury Program',
    href: 'https://www.dhcs.ca.gov/services/Pages/TPLRD_PersonalInjuryProgram.aspx'
  }
];

export const SEO_GUIDES: SeoGuide[] = [
  {
    slug: 'california-car-accident-settlement-factors',
    title: 'California Car Accident Settlement Factors',
    metaTitle: 'California Car Accident Settlement Factors',
    description:
      'Learn the California-specific factors that can affect a car accident settlement estimate, including injury severity, treatment, fault, insurance, venue, and liens.',
    directAnswer:
      'The biggest California car accident settlement factors are liability, injury severity, medical treatment, wage loss, daily-life impact, insurance limits, liens, venue, and the evidence tying the injury to the crash.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'A higher gross settlement does not always mean a higher net recovery after fees, liens, medical balances, and costs.',
      'California personal injury claims are fact specific, so the strongest estimates separate medical specials, general damages, fault, and insurance context.',
      'The calculator is built for educational planning and should be paired with deadline awareness.'
    ],
    sections: [
      {
        heading: 'Liability and evidence come first',
        body:
          'Before a settlement range matters, the claim needs proof that another person or business caused the crash and that the crash caused the injuries. Photos, police reports, witness details, medical records, repair evidence, and consistent treatment notes can all affect the way an insurer evaluates risk.'
      },
      {
        heading: 'Treatment history shapes the medical foundation',
        body:
          'Emergency care, imaging, physical therapy, injections, surgery, and follow-up care tell a different story than a single visit with no documented recovery plan. The calculator uses treatment patterns instead of asking users to type raw bills into a public form.'
      },
      {
        heading: 'Insurance and liens affect the final check',
        body:
          'Available liability insurance, health insurance reimbursement, Medi-Cal liens, provider balances, attorney fees, and case costs can all change the net amount after a gross settlement is reached.'
      }
    ],
    comparison: {
      columns: ['Factor', 'Why it matters', 'Calculator signal'],
      rows: [
        ['Comparative fault', 'Can reduce the recoverable amount by the claimant fault share', 'Reported fault percentage'],
        ['Medical treatment', 'Creates the strongest documented loss category', 'Treatment type, status, and estimated specials'],
        ['Daily-life impact', 'Supports non-economic damage context', 'Work, sleep, caregiving, and activity disruption'],
        ['Venue', 'County context can affect risk expectations', 'California accident county']
      ]
    },
    calculatorUse:
      'Use the calculator to organize claim facts before talking numbers. It estimates a range from injury, treatment, impact, county, and fault inputs, then keeps exact values protected until unlock.',
    faqs: [
      {
        question: 'What is the most important car accident settlement factor in California?',
        answer:
          'Liability and injury proof usually matter most. If fault, causation, or treatment documentation is weak, even a serious-sounding injury can be disputed.'
      },
      {
        question: 'Do policy limits cap every California settlement?',
        answer:
          'Insurance limits often affect practical recovery, but the calculator does not use policy limits as an automatic value cap because coverage, defendants, and collection facts can vary.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-comparative-fault-car-accident-settlements',
      'california-car-accident-medical-bills-and-liens',
      'california-car-accident-settlement-timeline'
    ],
    keywords: [
      'California car accident settlement factors',
      'auto injury settlement factors California',
      'California car accident claim value'
    ]
  },
  {
    slug: 'california-whiplash-settlement-calculator',
    title: 'California Whiplash Settlement Calculator',
    metaTitle: 'California Whiplash Settlement Calculator',
    description:
      'Estimate California whiplash settlement factors with treatment, duration, impact severity, medical specials, work disruption, and comparative fault context.',
    directAnswer:
      'A California whiplash settlement estimate usually depends on treatment length, objective findings, symptom consistency, work disruption, crash severity, medical specials, and whether the insurer disputes causation.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'Soft-tissue neck injuries are often disputed when treatment is delayed or inconsistent.',
      'Imaging, specialist referrals, injections, or longer treatment can change the risk profile.',
      'The calculator treats whiplash as part of a full injury and treatment pattern, not as a fixed dollar value.'
    ],
    sections: [
      {
        heading: 'Whiplash cases are evidence sensitive',
        body:
          'Neck pain after a collision can be real even when early imaging is normal. Insurers still look closely at timing, prior neck complaints, treatment consistency, impact severity, and whether the medical records connect the symptoms to the crash.'
      },
      {
        heading: 'Treatment duration changes the estimate',
        body:
          'A short course of conservative care creates a different estimate profile than months of physical therapy, pain management, injections, or surgical consultation. The calculator asks about treatment milestones to avoid a one-size-fits-all whiplash number.'
      },
      {
        heading: 'Daily disruption helps explain general damages',
        body:
          'Sleep interruption, missed work, headaches, reduced driving tolerance, caregiving limits, and recreation limits can support the non-economic side of the estimate when they are consistent with the injury record.'
      }
    ],
    comparison: {
      columns: ['Whiplash profile', 'Common dispute', 'Stronger support'],
      rows: [
        ['Mild short-term neck strain', 'Minimal treatment and fast recovery', 'Consistent early care and documented improvement'],
        ['Persistent symptoms', 'Causation and prior condition arguments', 'Ongoing records, referrals, and functional limits'],
        ['Radiating pain', 'Whether symptoms are crash related', 'Imaging, neurological findings, or specialist review'],
        ['Work disruption', 'Whether time off was necessary', 'Employer records and medical restrictions']
      ]
    },
    calculatorUse:
      'Select the neck injury area, treatment progression, crash impact, work-life disruption, and fault percentage so the estimate reflects a whiplash pattern instead of a generic average.',
    faqs: [
      {
        question: 'Can whiplash have settlement value without a fracture?',
        answer:
          'Yes. Many neck injury claims involve soft-tissue harm, but value depends heavily on treatment records, duration, symptoms, liability, and insurer disputes.'
      },
      {
        question: 'Does delayed treatment hurt a whiplash claim?',
        answer:
          'It can. A treatment gap gives insurers room to argue the symptoms were unrelated, less serious, or caused by something else.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-car-accident-settlement-factors',
      'california-car-accident-pain-and-suffering-calculator',
      'california-car-accident-settlement-timeline'
    ],
    keywords: [
      'California whiplash settlement calculator',
      'whiplash settlement California',
      'neck injury car accident settlement calculator'
    ]
  },
  {
    slug: 'california-car-accident-pain-and-suffering-calculator',
    title: 'California Car Accident Pain and Suffering Calculator',
    metaTitle: 'California Pain and Suffering Calculator for Car Accidents',
    description:
      'Understand how pain and suffering can be estimated in a California car accident claim using severity, treatment, recovery time, daily-life impact, and comparative fault.',
    directAnswer:
      'Pain and suffering in a California car accident claim is usually estimated from the human impact of the injury: pain duration, treatment burden, recovery limits, sleep, work, family duties, activities, and the credibility of the evidence.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'Pain and suffering is not just a multiplier; it should be tied to documented injury impact.',
      'Medical specials help anchor the estimate, but the daily-life story explains why the number moves up or down.',
      'Comparative fault can reduce the final recoverable amount even when pain is well documented.'
    ],
    sections: [
      {
        heading: 'General damages need a factual story',
        body:
          'Pain, inconvenience, anxiety, sleep disruption, reduced mobility, and loss of normal activities can be part of the claim story. The strongest estimates connect those impacts to medical records and consistent real-world details.'
      },
      {
        heading: 'Medical specials are only one anchor',
        body:
          'Some calculators multiply medical bills by a single number. This app uses treatment type, injury severity, impact, work-life signals, and fault context so pain and suffering is not reduced to one blunt formula.'
      },
      {
        heading: 'Net recovery is different from gross value',
        body:
          'A gross pain and suffering estimate does not account for attorney fees, medical liens, provider balances, reimbursement claims, or case costs. Those deductions can matter as much as the gross number.'
      }
    ],
    comparison: {
      columns: ['Signal', 'Lower estimate pressure', 'Higher estimate pressure'],
      rows: [
        ['Treatment', 'Brief care and quick discharge', 'Ongoing care, specialist review, or procedures'],
        ['Symptoms', 'Short-term soreness', 'Persistent pain, radiating symptoms, or sleep disruption'],
        ['Function', 'No work or activity limits', 'Documented work, caregiving, or mobility limits'],
        ['Fault', 'High claimant fault share', 'Clear liability against the other driver']
      ]
    },
    calculatorUse:
      'The calculator asks about daily-life limits and treatment progression because pain and suffering is strongest when it is connected to specific injury consequences.',
    faqs: [
      {
        question: 'Is there a standard pain and suffering multiplier in California?',
        answer:
          'No official multiplier controls every case. Multipliers are shorthand, not law, and actual value depends on evidence, severity, treatment, liability, and negotiation.'
      },
      {
        question: 'Can pain and suffering be claimed without lost wages?',
        answer:
          'Yes. Lost wages can support impact, but pain, inconvenience, and activity limits may still matter even when the injured person did not miss paid work.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-car-accident-settlement-factors',
      'california-whiplash-settlement-calculator',
      'california-comparative-fault-car-accident-settlements'
    ],
    keywords: [
      'California pain and suffering calculator',
      'car accident pain and suffering California',
      'California auto accident general damages'
    ]
  },
  {
    slug: 'california-comparative-fault-car-accident-settlements',
    title: 'California Comparative Fault in Car Accident Settlements',
    metaTitle: 'California Comparative Fault Car Accident Settlements',
    description:
      'Learn how comparative fault can reduce a California car accident settlement estimate and how reported responsibility should be handled in a calculator.',
    directAnswer:
      'Comparative fault means a California car accident settlement estimate may be reduced by the injured person share of responsibility for the crash.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'Fault is often negotiated, not simply accepted from an adjuster first statement.',
      'Photos, vehicle damage, traffic controls, witness statements, and police reports can affect fault allocation.',
      'A calculator should apply the reported fault percentage transparently so users can see the impact.'
    ],
    sections: [
      {
        heading: 'Fault percentage changes the recovery math',
        body:
          'If damages are valued at one number but the injured person is assigned a share of fault, the recoverable amount can be reduced. This is why the calculator asks for a fault percentage instead of assuming the other driver is always fully responsible.'
      },
      {
        heading: 'Fault can be disputed',
        body:
          'An insurer may argue speeding, unsafe lane changes, distraction, delayed braking, or failure to mitigate injuries. Claimants should keep evidence that explains how the collision happened and why the other party was responsible.'
      },
      {
        heading: 'Venue and evidence still matter',
        body:
          'The same fault dispute can feel different depending on available evidence, witnesses, county venue, and the seriousness of the injury. Fault is one input, not the whole claim.'
      }
    ],
    comparison: {
      columns: ['Fault issue', 'Estimate effect', 'Helpful evidence'],
      rows: [
        ['Clear rear-end impact', 'Often stronger liability, subject to facts', 'Photos, repair records, traffic report'],
        ['Intersection dispute', 'Fault allocation can move sharply', 'Signals, witnesses, dashcam, point of impact'],
        ['Shared lane-change crash', 'May reduce recovery if both drivers contributed', 'Lane position, damage pattern, statements'],
        ['Claimant partly at fault', 'Estimate reduced by reported share', 'Any evidence limiting the claimant share']
      ]
    },
    calculatorUse:
      'Enter the fault share that best reflects the current claim posture. If that number changes later, update the estimate to see how the range moves.',
    faqs: [
      {
        question: 'Can I still recover if I was partly at fault in California?',
        answer:
          'Often yes, but the amount may be reduced by your share of fault. Case-specific legal questions should be reviewed with a qualified professional.'
      },
      {
        question: 'Should I use the insurance adjuster fault percentage?',
        answer:
          'Use the best current estimate available, but remember that adjuster positions can be disputed with evidence.'
      }
    ],
    sources: [
      {
        label: 'Judicial Council of California Civil Jury Instructions resource center',
        href: 'https://courts.ca.gov/partners/california-jury-instructions/civil-jury-instructions-resource-center/civil-jury'
      },
      ...sharedSources
    ],
    related: [
      'california-car-accident-settlement-factors',
      'california-auto-injury-settlement-by-county',
      'california-car-accident-settlement-faq'
    ],
    keywords: [
      'California comparative fault car accident',
      'California car accident settlement fault percentage',
      'comparative negligence settlement calculator California'
    ]
  },
  {
    slug: 'california-car-accident-settlement-timeline',
    title: 'California Car Accident Settlement Timeline',
    metaTitle: 'California Car Accident Settlement Timeline',
    description:
      'Understand the typical phases that affect a California car accident settlement timeline, from treatment and records to demand, negotiation, lawsuit deadlines, and liens.',
    directAnswer:
      'A California car accident settlement timeline usually depends on medical recovery, record collection, demand timing, negotiation, liability disputes, lawsuit deadlines, and lien resolution.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'Fast settlements may leave unknown treatment, liens, or future symptoms unresolved.',
      'Serious injury claims often wait for medical stability before a demand package is complete.',
      'California deadlines still matter even when negotiations are ongoing.'
    ],
    sections: [
      {
        heading: 'Treatment timing drives the early phase',
        body:
          'Many claims cannot be valued responsibly until the medical picture is clearer. Emergency records, imaging, therapy notes, specialist opinions, work restrictions, and discharge status can all affect when the claim is ready for demand.'
      },
      {
        heading: 'Negotiation timing depends on disputes',
        body:
          'Clear liability and complete records can move faster than claims with disputed fault, prior injuries, treatment gaps, or low policy limits. A settlement timeline is not just calendar time; it is evidence readiness.'
      },
      {
        heading: 'Deadlines are separate from negotiation pace',
        body:
          'California Courts explain that personal injury cases usually have a two-year deadline, and government claims can involve shorter timing. Do not rely on informal talks to protect a deadline.'
      }
    ],
    comparison: {
      columns: ['Phase', 'What happens', 'Common delay'],
      rows: [
        ['Treatment and recovery', 'Medical condition and care plan develop', 'Ongoing symptoms or specialist referrals'],
        ['Records and demand', 'Bills, records, wage proof, and impact evidence are collected', 'Missing records or unclear bills'],
        ['Negotiation', 'Insurer evaluates liability and damages', 'Fault, causation, or policy limit disputes'],
        ['Lien resolution', 'Reimbursement claims and balances are reviewed', 'Medi-Cal, health plan, or provider lien delays']
      ]
    },
    calculatorUse:
      'Use the calculator early to understand claim factors, then update it when treatment status, work impact, or fault position changes.',
    faqs: [
      {
        question: 'Should I settle before finishing treatment?',
        answer:
          'That can be risky if symptoms, future care, or liens are still unclear. The right timing is case specific.'
      },
      {
        question: 'Does the two-year deadline mean I should wait?',
        answer:
          'No. Evidence can fade, and some claims involve shorter deadlines. The deadline is not a strategy by itself.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-car-accident-settlement-factors',
      'california-car-accident-medical-bills-and-liens',
      'california-car-accident-settlement-faq'
    ],
    keywords: [
      'California car accident settlement timeline',
      'how long car accident settlement takes California',
      'California injury claim timeline'
    ]
  },
  {
    slug: 'california-car-accident-medical-bills-and-liens',
    title: 'California Car Accident Medical Bills and Liens',
    metaTitle: 'California Car Accident Medical Bills and Liens',
    description:
      'Learn how medical bills, provider balances, Medi-Cal liens, health insurance reimbursement, and attorney fees can affect a California car accident settlement.',
    directAnswer:
      'Medical bills and liens can reduce the net recovery from a California car accident settlement even when the gross settlement number looks strong.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'Gross settlement value and net recovery are different numbers.',
      'Medi-Cal, health insurers, medical providers, and case-cost reimbursements may need to be resolved from settlement funds.',
      'The calculator separates gross estimate education from deductions such as fees, liens, balances, and costs.'
    ],
    sections: [
      {
        heading: 'Medical specials help anchor the claim',
        body:
          'Medical specials are commonly used to describe medical charges or expenses tied to the injury. Their settlement role depends on treatment reasonableness, causation, reductions, write-offs, reimbursement rights, and provider balances.'
      },
      {
        heading: 'Liens and reimbursement claims can change net recovery',
        body:
          'DHCS explains that its Personal Injury Program seeks reimbursement for Medi-Cal paid services tied to personal injury actions. Private health plans and medical providers may also assert reimbursement or lien claims depending on the facts and agreements.'
      },
      {
        heading: 'Net estimates should be handled carefully',
        body:
          'A calculator can educate users about deductions, but exact lien negotiation, health plan rights, provider balances, and settlement distribution are case-specific issues.'
      }
    ],
    comparison: {
      columns: ['Deduction type', 'What it can affect', 'Why it matters'],
      rows: [
        ['Attorney fees', 'Net recovery after gross settlement', 'Contingency percentages vary by agreement and case phase'],
        ['Medical liens', 'Repayment from settlement funds', 'Medi-Cal, providers, or insurers may claim reimbursement'],
        ['Case costs', 'Net distribution', 'Records, filing fees, experts, and investigation can be reimbursed'],
        ['Provider balances', 'Amount owed after treatment', 'Bills may be negotiated, reduced, disputed, or paid']
      ]
    },
    calculatorUse:
      'The result page distinguishes gross estimate context from deductions so users do not confuse the settlement range with the final take-home amount.',
    faqs: [
      {
        question: 'Are medical bills paid before I receive settlement funds?',
        answer:
          'Often, liens, reimbursement claims, balances, fees, and costs are resolved from settlement funds before a final distribution.'
      },
      {
        question: 'Does Medi-Cal have to be notified of a personal injury settlement?',
        answer:
          'DHCS publishes a Personal Injury Program and lien process for Medi-Cal paid services. Case-specific compliance questions should be handled carefully.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-car-accident-settlement-factors',
      'california-car-accident-pain-and-suffering-calculator',
      'california-car-accident-settlement-timeline'
    ],
    keywords: [
      'California car accident medical liens',
      'Medi-Cal lien car accident settlement',
      'California accident settlement medical bills'
    ]
  },
  {
    slug: 'california-auto-injury-settlement-by-county',
    title: 'California Auto Injury Settlement by County',
    metaTitle: 'California Auto Injury Settlement by County',
    description:
      'Learn why county venue can matter in a California auto injury settlement estimate and how accident county context fits into the calculator.',
    directAnswer:
      'County can matter because venue, local jury expectations, court practices, medical markets, and negotiation risk can affect how California auto injury claims are evaluated.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'County is a context factor, not a promise that one location guarantees a higher settlement.',
      'California Courts explain that venue is often tied to where the injury happened or where the defendant lives or does business.',
      'The calculator uses county conservatively as one small factor among injury, treatment, impact, and fault.'
    ],
    sections: [
      {
        heading: 'Venue is part of negotiation risk',
        body:
          'Insurers and attorneys often think about where a lawsuit could be filed if settlement fails. A county with different jury pools, congestion, local practices, and medical costs can change negotiation posture.'
      },
      {
        heading: 'County should not overpower the facts',
        body:
          'A strong liability case with serious treatment usually matters more than county alone. Likewise, a weak causation record is not fixed by choosing a favorable venue label.'
      },
      {
        heading: 'Why this app starts with one county explainer',
        body:
          'The site avoids mass-producing thin pages for all 58 counties. This page explains the county concept first; county-specific pages should only be added later when there is enough unique data and user demand.'
      }
    ],
    comparison: {
      columns: ['County factor', 'Estimate role', 'Important limit'],
      rows: [
        ['Venue tendency', 'Small adjustment for negotiation risk', 'Not a guaranteed outcome'],
        ['Medical market', 'Can affect specials and treatment patterns', 'Bills still need causation support'],
        ['Court timing', 'Can influence settlement pressure', 'Deadlines still apply statewide'],
        ['Local evidence', 'Police, witnesses, and providers may be county based', 'Evidence quality matters more than labels']
      ]
    },
    calculatorUse:
      'Choose the accident county so the estimate can apply California venue context without turning county into the main value driver.',
    faqs: [
      {
        question: 'Which California county has the highest settlements?',
        answer:
          'There is no reliable public list that guarantees higher settlements by county. Injury severity, evidence, insurance, and fault remain central.'
      },
      {
        question: 'Why does the calculator ask for accident county?',
        answer:
          'County helps approximate venue context and local claim dynamics. It is used as a conservative factor, not a promise.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-car-accident-settlement-factors',
      'california-comparative-fault-car-accident-settlements',
      'california-car-accident-settlement-faq'
    ],
    keywords: [
      'California auto injury settlement by county',
      'California car accident settlement county',
      'California personal injury venue settlement'
    ]
  },
  {
    slug: 'california-car-accident-settlement-faq',
    title: 'California Car Accident Settlement FAQ',
    metaTitle: 'California Car Accident Settlement FAQ',
    description:
      'Answers to common California car accident settlement questions about calculators, timelines, whiplash, pain and suffering, comparative fault, medical bills, and liens.',
    directAnswer:
      'A California car accident settlement estimate is strongest when it separates injury proof, medical treatment, pain and suffering, fault, insurance, timeline, and lien questions instead of relying on a single average number.',
    byline: 'California Settlement Calculator editorial team',
    lastReviewed: SEO_LAST_REVIEWED,
    takeaways: [
      'No public calculator can guarantee a settlement outcome.',
      'California deadlines, fault allocation, medical proof, and liens can all change the practical value of a claim.',
      'Use the calculator as a preparation tool, then treat case-specific legal or lien questions separately.'
    ],
    sections: [
      {
        heading: 'Use FAQs to pressure-test assumptions',
        body:
          'People often search for one number, but settlement value is a chain of assumptions. If one assumption changes, the estimate can move: fault, treatment, diagnosis, policy limits, lien claims, or deadline posture.'
      },
      {
        heading: 'The calculator focuses on structured inputs',
        body:
          'Instead of showing a generic chart, the app asks for county, injury areas, treatment, work-life disruption, comparative fault, and insurance context so the estimate is connected to the claim profile.'
      },
      {
        heading: 'Educational content is not legal advice',
        body:
          'This site explains common settlement concepts for California auto injury claims. It does not provide legal advice, predict court results, or create an attorney-client relationship.'
      }
    ],
    comparison: {
      columns: ['Question area', 'Short answer', 'Where to go next'],
      rows: [
        ['Whiplash', 'Treatment and symptom duration matter', 'Use the whiplash guide'],
        ['Pain and suffering', 'Evidence of daily impact matters', 'Use the pain and suffering guide'],
        ['Comparative fault', 'Fault share can reduce recovery', 'Use the comparative fault guide'],
        ['Medical liens', 'Gross and net recovery differ', 'Use the medical bills and liens guide']
      ]
    },
    calculatorUse:
      'Start with the calculator, then use the guide pages to understand why each answer changes the range.',
    faqs: [
      {
        question: 'What is my California car accident settlement worth?',
        answer:
          'There is no reliable single average for every case. Value depends on injury severity, treatment, liability, insurance, medical specials, liens, venue, and evidence.'
      },
      {
        question: 'Can I use the calculator if I already have an attorney?',
        answer:
          'Yes. The calculator is educational and does not replace your attorney. It also does not route users to attorneys or create representation.'
      },
      {
        question: 'Will the estimate show exact numbers immediately?',
        answer:
          'The app prepares protected estimate values and uses an unlock flow before showing exact settlement ranges.'
      },
      {
        question: 'Are ads likely to appear above organic results for these searches?',
        answer:
          'Often, yes. That is why the strategy targets long-tail organic queries, structured answers, AI citations, and a useful calculator experience instead of relying only on head terms.'
      }
    ],
    sources: sharedSources,
    related: [
      'california-car-accident-settlement-factors',
      'california-whiplash-settlement-calculator',
      'california-car-accident-medical-bills-and-liens'
    ],
    keywords: [
      'California car accident settlement FAQ',
      'California auto injury settlement questions',
      'California settlement calculator questions'
    ]
  }
];

export const SEO_GUIDE_BY_SLUG = SEO_GUIDES.reduce((acc, guide) => {
  acc[guide.slug] = guide;
  return acc;
}, {} as Record<SeoGuideSlug, SeoGuide>);

export function getSeoGuide(slug: SeoGuideSlug): SeoGuide {
  return SEO_GUIDE_BY_SLUG[slug];
}

export function buildGuideMetadata(slug: SeoGuideSlug): Metadata {
  const guide = getSeoGuide(slug);

  return buildPageMetadata({
    title: guide.metaTitle,
    description: guide.description,
    path: `/${guide.slug}`,
    keywords: guide.keywords,
    type: 'article'
  });
}
