import { ContentType, AspectRatio } from '@/lib/services/render/image-generator';

// Template configuration for different financial content types
export const financialTemplates = {
  // Market Update Templates
  marketUpdate: {
    daily: {
      id: 'market-daily',
      name: 'Daily Market Update',
      contentType: ContentType.MARKET_UPDATE,
      aspectRatio: AspectRatio.WHATSAPP,
      elements: {
        title: 'Market Update - {{date}}',
        sections: [
          {
            type: 'indices',
            title: 'Key Indices',
            items: ['Nifty 50', 'Sensex', 'Bank Nifty', 'Nifty IT'],
          },
          {
            type: 'sectors',
            title: 'Top Performing Sectors',
            items: ['Banking', 'IT', 'Pharma', 'Auto'],
          },
          {
            type: 'news',
            title: 'Key Headlines',
            items: ['{{headline1}}', '{{headline2}}', '{{headline3}}'],
          },
        ],
      },
      colors: {
        positive: '#10B981', // Green
        negative: '#EF4444', // Red
        neutral: '#6B7280',  // Gray
      },
    },
    weekly: {
      id: 'market-weekly',
      name: 'Weekly Market Summary',
      contentType: ContentType.MARKET_UPDATE,
      aspectRatio: AspectRatio.LANDSCAPE,
      elements: {
        title: 'Weekly Market Wrap - Week {{weekNumber}}',
        charts: ['performance', 'volume', 'volatility'],
        insights: {
          bullish: '{{bullishFactors}}',
          bearish: '{{bearishFactors}}',
          outlook: '{{weeklyOutlook}}',
        },
      },
    },
  },

  // Investment Tips Templates
  investmentTips: {
    sip: {
      id: 'tip-sip',
      name: 'SIP Investment Tip',
      contentType: ContentType.INVESTMENT_TIP,
      aspectRatio: AspectRatio.SQUARE,
      elements: {
        icon: 'trending-up',
        title: 'Smart SIP Strategy',
        tip: '{{sipTip}}',
        benefits: ['Rupee Cost Averaging', 'Power of Compounding', 'Disciplined Investing'],
        cta: 'Start Your SIP Today',
      },
    },
    taxSaving: {
      id: 'tip-tax',
      name: 'Tax Saving Tip',
      contentType: ContentType.TAX_PLANNING,
      aspectRatio: AspectRatio.SQUARE,
      elements: {
        icon: 'shield',
        title: 'Save Tax Under Section {{section}}',
        tip: '{{taxTip}}',
        limit: '₹{{limit}}',
        deadline: '{{deadline}}',
        instruments: ['ELSS', 'PPF', 'NSC', 'Tax Saver FD'],
      },
    },
  },

  // Mutual Fund Templates
  mutualFund: {
    nfo: {
      id: 'mf-nfo',
      name: 'New Fund Offer',
      contentType: ContentType.MUTUAL_FUND,
      aspectRatio: AspectRatio.WHATSAPP,
      elements: {
        badge: 'NEW FUND OFFER',
        fundName: '{{fundName}}',
        fundHouse: '{{amc}}',
        category: '{{category}}',
        openDate: '{{openDate}}',
        closeDate: '{{closeDate}}',
        minInvestment: '₹{{minAmount}}',
        highlights: ['{{highlight1}}', '{{highlight2}}', '{{highlight3}}'],
      },
    },
    performance: {
      id: 'mf-performance',
      name: 'Fund Performance',
      contentType: ContentType.MUTUAL_FUND,
      aspectRatio: AspectRatio.LANDSCAPE,
      elements: {
        fundName: '{{fundName}}',
        returns: {
          '1Y': '{{return1Y}}%',
          '3Y': '{{return3Y}}%',
          '5Y': '{{return5Y}}%',
        },
        rating: '{{starRating}}',
        benchmark: '{{benchmark}}',
        aum: '₹{{aum}} Cr',
      },
    },
  },

  // Portfolio Insights Templates
  portfolio: {
    review: {
      id: 'portfolio-review',
      name: 'Portfolio Review',
      contentType: ContentType.PORTFOLIO_INSIGHT,
      aspectRatio: AspectRatio.LANDSCAPE,
      elements: {
        title: 'Your Portfolio Health Check',
        allocation: {
          equity: '{{equityPercent}}%',
          debt: '{{debtPercent}}%',
          gold: '{{goldPercent}}%',
          others: '{{othersPercent}}%',
        },
        performance: '{{overallReturn}}%',
        risk: '{{riskLevel}}',
        recommendations: ['{{reco1}}', '{{reco2}}', '{{reco3}}'],
      },
    },
    rebalancing: {
      id: 'portfolio-rebalance',
      name: 'Rebalancing Alert',
      contentType: ContentType.PORTFOLIO_INSIGHT,
      aspectRatio: AspectRatio.SQUARE,
      elements: {
        title: 'Time to Rebalance',
        current: '{{currentAllocation}}',
        target: '{{targetAllocation}}',
        action: '{{actionRequired}}',
        benefit: '{{expectedBenefit}}',
      },
    },
  },

  // Financial Literacy Templates
  education: {
    basics: {
      id: 'edu-basics',
      name: 'Financial Basics',
      contentType: ContentType.FINANCIAL_LITERACY,
      aspectRatio: AspectRatio.SQUARE,
      elements: {
        series: 'Financial Literacy Series',
        episodeNumber: '{{episode}}',
        topic: '{{topic}}',
        keyPoints: ['{{point1}}', '{{point2}}', '{{point3}}'],
        example: '{{example}}',
        takeaway: '{{keyTakeaway}}',
      },
    },
    myth: {
      id: 'edu-myth',
      name: 'Myth Buster',
      contentType: ContentType.FINANCIAL_LITERACY,
      aspectRatio: AspectRatio.PORTRAIT,
      elements: {
        title: 'Myth Buster',
        myth: '{{myth}}',
        fact: '{{fact}}',
        explanation: '{{explanation}}',
        icon: 'alert-triangle',
      },
    },
  },

  // Festive & Seasonal Templates
  seasonal: {
    diwali: {
      id: 'fest-diwali',
      name: 'Diwali Greetings',
      contentType: ContentType.FESTIVE_GREETING,
      aspectRatio: AspectRatio.SQUARE,
      elements: {
        greeting: 'Happy Diwali!',
        message: 'May this festival of lights brighten your path to financial prosperity',
        decoration: 'diya',
        colors: {
          primary: '#FFD700', // Gold
          secondary: '#FF6B35', // Saffron
          accent: '#4B0082', // Indigo
        },
      },
    },
    newYear: {
      id: 'fest-newyear',
      name: 'New Year Wishes',
      contentType: ContentType.FESTIVE_GREETING,
      aspectRatio: AspectRatio.WHATSAPP,
      elements: {
        greeting: 'Happy New Year {{year}}!',
        message: 'Start your wealth creation journey this year',
        resolutions: [
          'Start SIP',
          'Review Insurance',
          'Plan Taxes',
          'Build Emergency Fund',
        ],
      },
    },
    holi: {
      id: 'fest-holi',
      name: 'Holi Greetings',
      contentType: ContentType.FESTIVE_GREETING,
      aspectRatio: AspectRatio.SQUARE,
      elements: {
        greeting: 'Happy Holi!',
        message: 'Add colors to your portfolio with diversified investments',
        colors: {
          primary: '#FF1744', // Red
          secondary: '#00E676', // Green
          accent: '#2979FF', // Blue
        },
      },
    },
  },

  // Regulatory & Compliance Templates
  regulatory: {
    update: {
      id: 'reg-update',
      name: 'Regulatory Update',
      contentType: ContentType.REGULATORY_UPDATE,
      aspectRatio: AspectRatio.WHATSAPP,
      elements: {
        badge: 'IMPORTANT UPDATE',
        title: '{{updateTitle}}',
        authority: '{{regulatoryBody}}',
        effectiveDate: '{{effectiveDate}}',
        impact: '{{impact}}',
        action: '{{actionRequired}}',
        disclaimer: 'Please consult your financial advisor for personalized advice',
      },
    },
    compliance: {
      id: 'reg-compliance',
      name: 'Compliance Reminder',
      contentType: ContentType.REGULATORY_UPDATE,
      aspectRatio: AspectRatio.LANDSCAPE,
      elements: {
        title: 'Compliance Deadline',
        requirement: '{{requirement}}',
        deadline: '{{deadline}}',
        documents: ['{{doc1}}', '{{doc2}}', '{{doc3}}'],
        consequences: '{{consequences}}',
        cta: 'Complete Now',
      },
    },
  },
};

// Color schemes for different moods/themes
export const colorSchemes = {
  professional: {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    text: '#1F2937',
    background: '#F9FAFB',
  },
  trustworthy: {
    primary: '#047857',
    secondary: '#10B981',
    accent: '#34D399',
    text: '#064E3B',
    background: '#ECFDF5',
  },
  premium: {
    primary: '#7C2D12',
    secondary: '#B91C1C',
    accent: '#DC2626',
    text: '#450A0A',
    background: '#FEF2F2',
  },
  modern: {
    primary: '#4C1D95',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    text: '#2E1065',
    background: '#F5F3FF',
  },
  festive: {
    primary: '#EA580C',
    secondary: '#F97316',
    accent: '#FB923C',
    text: '#7C2D12',
    background: '#FFF7ED',
  },
};

// Font combinations for different styles
export const fontCombinations = {
  classic: {
    heading: 'Playfair Display',
    body: 'Source Sans Pro',
    caption: 'Source Sans Pro',
  },
  modern: {
    heading: 'Montserrat',
    body: 'Inter',
    caption: 'Inter',
  },
  elegant: {
    heading: 'Cormorant Garamond',
    body: 'Lato',
    caption: 'Lato',
  },
  bold: {
    heading: 'Bebas Neue',
    body: 'Open Sans',
    caption: 'Open Sans',
  },
  minimal: {
    heading: 'Inter',
    body: 'Inter',
    caption: 'Inter',
  },
};

// Template variations for different languages
export const languageVariations = {
  hi: {
    marketUpdate: {
      title: 'बाजार अपडेट - {{date}}',
      sections: {
        indices: 'मुख्य सूचकांक',
        sectors: 'शीर्ष प्रदर्शन क्षेत्र',
        news: 'मुख्य समाचार',
      },
    },
    investmentTip: {
      title: 'निवेश टिप',
      benefits: 'लाभ',
      cta: 'आज ही शुरू करें',
    },
    festive: {
      diwali: 'दीपावली की हार्दिक शुभकामनाएं!',
      holi: 'होली की हार्दिक शुभकामनाएं!',
      newYear: 'नव वर्ष की शुभकामनाएं!',
    },
  },
  mr: {
    marketUpdate: {
      title: 'बाजार अद्यतन - {{date}}',
      sections: {
        indices: 'मुख्य निर्देशांक',
        sectors: 'सर्वोत्तम कामगिरी क्षेत्र',
        news: 'मुख्य बातम्या',
      },
    },
    investmentTip: {
      title: 'गुंतवणूक टिप',
      benefits: 'फायदे',
      cta: 'आज सुरू करा',
    },
    festive: {
      diwali: 'दिवाळीच्या हार्दिक शुभेच्छा!',
      holi: 'होळीच्या हार्दिक शुभेच्छा!',
      newYear: 'नवीन वर्षाच्या शुभेच्छा!',
    },
  },
};

// Quick template presets for common use cases
export const quickPresets = [
  {
    id: 'daily-update',
    name: 'Daily Market Update',
    description: 'Professional market summary with indices and news',
    template: 'market-daily',
    defaultData: {
      date: new Date().toLocaleDateString(),
      headline1: 'Markets close higher on positive global cues',
      headline2: 'Banking stocks lead the rally',
      headline3: 'FII inflows continue for third straight day',
    },
  },
  {
    id: 'sip-reminder',
    name: 'SIP Reminder',
    description: 'Monthly SIP investment reminder',
    template: 'tip-sip',
    defaultData: {
      sipTip: 'Continue your SIP even in volatile markets for better long-term returns',
    },
  },
  {
    id: 'tax-deadline',
    name: 'Tax Saving Reminder',
    description: 'Section 80C investment deadline reminder',
    template: 'tip-tax',
    defaultData: {
      section: '80C',
      taxTip: 'Invest in ELSS funds for tax saving with market-linked returns',
      limit: '1,50,000',
      deadline: 'March 31st',
    },
  },
  {
    id: 'festival-wish',
    name: 'Festival Greeting',
    description: 'Festive wishes with financial message',
    template: 'fest-diwali',
    defaultData: {},
  },
];

export default financialTemplates;