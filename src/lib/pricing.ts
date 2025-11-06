
export const USD_TO_INR_RATE = 83;

export const vendorToolMapping: { [key: string]: string[] } = {
  "Google": ["Google Workspace", "Google Cloud"],
  "Microsoft": ["Microsoft 365", "Azure", "GitHub"],
  "Adobe": ["Adobe Creative Cloud", "Adobe Express", "Adobe Acrobat Pro"],
  "Atlassian": ["Jira", "Confluence", "Trello"],
  "Figma": ["Figma", "FigJam"],
  "Canva": ["Canva Pro", "Canva for Teams"],
  "Zoom": ["Zoom Meetings", "Zoom Webinar"],
  "Slack": ["Slack Pro", "Slack Business+"],
  "Notion": ["Notion Plus", "Notion AI"],
  "OpenAI": ["ChatGPT Plus", "ChatGPT Team"],
};

export const pricingRules: { [key: string]: number } = {
  // All prices are per month in USD
  "Google Workspace": 12,
  "Microsoft 365": 20,
  "Adobe Creative Cloud": 55,
  "Jira": 7.75,
  "Confluence": 5.75,
  "Figma": 12,
  "Canva Pro": 13,
  "Zoom Meetings": 15,
  "Slack Pro": 8.75,
  "Notion AI": 10,
  "ChatGPT Plus": 20,
};

    