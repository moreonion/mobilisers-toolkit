const botUserAgents = [
    "SemrushBot",
    "SiteAuditBot",
    "SplitSignalBot",
    "AhrefsBot",
    "Bytespider",
    "AdsBot-Google",
    "Amazonbot",
    "anthropic-ai",
    "AwarioRssBot",
    "AwarioSmartBot",
    "CCBot",
    "ChatGPT",
    "ChatGPT-User",
    "Claude-Web",
    "ClaudeBot",
    "cohere-ai",
    "DataForSeoBot",
    "Diffbot",
    "FacebookBot",
    "GPTBot",
    "ImagesiftBot",
    "magpie-crawler",
    "omgili",
    "Omgilibot",
    "peer39_crawler",
    "YouBot",
];

export default async (request, context) => {
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const isBot = botUserAgents.some(botAgent =>
        userAgent.toLowerCase().includes(botAgent.toLowerCase())
    );

    if (isBot) {
        console.log(`Bot detected: User Agent: ${userAgent}`);
        return new Response(null, { status: 401 });
    }

    return await context.next();
};