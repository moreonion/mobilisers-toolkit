const botUserAgents = [
	"AdsBot-Google",
	"AhrefsBot",
	"AI2Bot",
	"aiHitBot",
	"Amazonbot",
	"anthropic-ai",
	"ApifyBot",
	"ApifyWebsiteContentCrawler",
	"Applebot-Extended",
	"Awario",
	"bedrockbot",
	"Brightbot",
	"Bytespider",
	"CCBot",
	"ClaudeBot",
	"cohere-training-data-crawler",
	"Cotoyogi",
	"Crawl4AI",
	"DataForSeoBot",
	"Datenbank Crawler",
	"DeepSeekBot",
	"Diffbot",
	"Echobot",
	"Echobox",
	"FacebookBot",
	"Factset_spyderbot",
	"FirecrawlAgent",
	"FriendlyCrawler",
	"Google-Extended",
	"GPTBot",
	"iaskspider",
	"ICC-Crawler",
	"imageSpider",
	"ImagesiftBot",
	"img2dataset",
	"ISSCyberRiskCrawler",
	"Kangaroo Bot",
	"laion-huggingface-processor",
	"LAIONDownloader",
	"Linguee Bot",
	"magpie-crawler",
	"Meta-ExternalAgent",
	"meta-webindexer",
	"MyCentralAIScraperBot",
	"NagetBot",
	"netEstate",
	"omgili",
	"PanguBot",
	"Panscient",
	"peer39",
	"QualifiedBot",
	"Scrapy",
	"SemrushBot",
	"Sidetrade indexer bot",
	"TikTokSpider",
	"Timpibot",
	"WARDBot",
	"Webzio-Extended",
	"YandexAdditional"
];

export default async (request, context) => {
	const userAgent = request.headers.get("user-agent") || "Unknown";
	const isBot = botUserAgents.some((botAgent) =>
		userAgent.toLowerCase().includes(botAgent.toLowerCase())
	);

	if (isBot) {
		console.log(`Bot detected: User Agent: ${userAgent}`);
		return new Response(null, { status: 401 });
	}

	return await context.next();
};
