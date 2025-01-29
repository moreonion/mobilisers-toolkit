import { derived, writable } from "svelte/store";
import type { Readable } from "svelte/store";

export const SHARE_TARGETS = [
  "Facebook",
  "Twitter / X",
  "WhatsApp",
  "Facebook Messenger",
  "Email",
  "Blue Sky",
  "LinkedIn",
  "Threads",
] as const;

type ShareTargets = (typeof SHARE_TARGETS)[number];

export const LinkToShare = writable("");

// Ensure LinkToTrack starts with 'https://' if it's not one of the excluded schemes
const prefixedLinkToShare = derived(LinkToShare, ($LinkToShare) => {
  if (
    !$LinkToShare.startsWith("http://") &&
    !$LinkToShare.startsWith("https://") &&
    !$LinkToShare.startsWith("fb-messenger://") &&
    !$LinkToShare.startsWith("mailto:")
  ) {
    return `https://${$LinkToShare}`;
  }
  return $LinkToShare;
});

const encodedLinkToShare: Readable<string> = derived(
  prefixedLinkToShare,
  (prefixedLinkToShare: string) => encodeURIComponent(prefixedLinkToShare)
);

type TwitterParametersType = {
  text: string;
  hashtags: string[];
};

function createTwitterParameters() {
  const { subscribe, update, set } = writable<TwitterParametersType>({
    text: "",
    hashtags: [],
  });

  return {
    subscribe,
    set,
    update,
    setHashtags: (hashtags: string[]) =>
      update((storeValue) => ({
        ...storeValue,
        hashtags: hashtags.map((hashtag) => hashtag.replace(/[\s-]/g, "_")), // replace spaces and dashes
      })),
  };
}

export const TwitterParameters = createTwitterParameters();

// Writable store for Tags component to bind to
export const TwitterInputHashtags = writable<string[]>([]);

// Update TwitterParameters when the InputHashtags change
TwitterInputHashtags.subscribe((hashtags) => {
  TwitterParameters.setHashtags(hashtags);
});

export const twitterParametersPartOfURL: Readable<string> = derived(
  TwitterParameters,
  ({ text, hashtags }: TwitterParametersType) => {
    let parametersURL = "";
    if (text !== "") {
      parametersURL += `&text=${encodeURIComponent(text)}`;
    }

    if (hashtags.length > 0) {
      parametersURL += `&hashtags=${hashtags.join(",")}`;
    }
    return parametersURL;
  }
);

type EmailParametersType = {
  subject: string;
  body: string;
};

export const EmailParameters = writable<EmailParametersType>({
  subject: "",
  body: "",
});

export const emailParametersPartOfURL: Readable<string> = derived(
  [EmailParameters, LinkToShare],
  ([params, LinkToShare]: [EmailParametersType, string]) => {
    const bodyContent =
      params.body !== ""
        ? `${params.body}\n\n${LinkToShare}`
        : `${LinkToShare}`;

    let parametersURL = `body=${encodeURIComponent(bodyContent)}`;

    if (params.subject !== "") {
      parametersURL += `&subject=${encodeURIComponent(params.subject)}`;
    }

    return parametersURL;
  }
);

type WhatsAppParametersType = {
  text: string;
};

export const WhatsAppParameters = writable<WhatsAppParametersType>({
  text: "",
});

// Writable store for user input text component to bind to
export const WhatsAppInputText = writable<string>("");

// Update WhatsAppParameters when the InputText change
WhatsAppInputText.subscribe((text) => {
  WhatsAppParameters.update((storeValue) => ({
    ...storeValue,
    text: text,
  }));
});

export const whatsAppParametersPartOfURL: Readable<string> = derived(
  [WhatsAppParameters, prefixedLinkToShare],
  ([params, prefixedLinkToShare]: [WhatsAppParametersType, string]) => {
    let parametersURL = "";

    const textContent =
      params.text !== ""
        ? `${params.text}\n\n${prefixedLinkToShare}`
        : `${prefixedLinkToShare}`;

    parametersURL += `${encodeURIComponent(textContent)}`;

    return parametersURL;
  }
);

type BlueSkyParametersType = {
  text: string;
};

export const BlueSkyParameters = writable<BlueSkyParametersType>({
  text: "",
});

// Writable store for user input text component to bind to
export const BlueSkyInputText = writable<string>("");

// Update BlueSkyParameters when the InputText change
BlueSkyInputText.subscribe((text) => {
  BlueSkyParameters.update((storeValue) => ({
    ...storeValue,
    text: text,
  }));
});

export const blueSkyParametersPartOfURL: Readable<string> = derived(
  [BlueSkyParameters, prefixedLinkToShare],
  ([params, prefixedLinkToShare]: [BlueSkyParametersType, string]) => {
    let parametersURL = "";

    const textContent =
      params.text !== ""
        ? `${params.text}\n\n${prefixedLinkToShare}`
        : `${prefixedLinkToShare}`;

    parametersURL += `${encodeURIComponent(textContent)}`;

    return parametersURL;
  }
);

type LinkedInParametersType = {
  text: string;
};

export const LinkedInParameters = writable<LinkedInParametersType>({
  text: "",
});

// Writable store for user input text component to bind to
export const LinkedInInputText = writable<string>("");

// Update LinkedInParameters when the InputText change
LinkedInInputText.subscribe((text) => {
  LinkedInParameters.update((storeValue) => ({
    ...storeValue,
    text: text,
  }));
});

export const linkedInParametersPartOfURL: Readable<string> = derived(
  [LinkedInParameters, prefixedLinkToShare],
  ([params, prefixedLinkToShare]: [LinkedInParametersType, string]) => {
    let parametersURL = "";

    const textContent =
      params.text !== ""
        ? `${params.text}\n\n${prefixedLinkToShare}`
        : `${prefixedLinkToShare}`;

    parametersURL += `${encodeURIComponent(textContent)}`;

    return parametersURL;
  }
);

// Threads docs suggest they support a separate url parameter, but it doesn't seem to work
// https://developers.facebook.com/docs/threads/threads-web-intents

type ThreadsParametersType = {
  text: string;
  // Keeping url in type but not using it currently
  // url: string;
};

export const ThreadsParameters = writable<ThreadsParametersType>({
  text: "",
  // url: "", // Keeping for future if url parameter support is fixed
});

export const threadsParametersPartOfURL: Readable<string> = derived(
  [ThreadsParameters, LinkToShare],
  ([params, LinkToShare]: [ThreadsParametersType, string]) => {
    // Combine text and link with newlines between if there's text
    const combinedText =
      params.text !== "" ? `${params.text}\n\n${LinkToShare}` : LinkToShare;

    return `text=${encodeURIComponent(combinedText)}`;

    /* Original url parameter implementation - kept for reference
	  let parametersURL = "";
	  if (params.text !== "") {
		parametersURL += `text=${encodeURIComponent(params.text)}`;
	  }
	  if (parametersURL !== "") {
		parametersURL += "&";
	  }
	  parametersURL += `url=${encodeURIComponent(LinkToShare)}`;
	  return parametersURL;
	  */
  }
);

type ShareLinkType = {
  platform: ShareTargets;
  shareLink: string;
};

type ShareLinkSchemaType = ShareLinkType[];

export const allShareLinks: Readable<ShareLinkSchemaType> = derived(
  [
    encodedLinkToShare,
    twitterParametersPartOfURL,
    emailParametersPartOfURL,
    whatsAppParametersPartOfURL,
    blueSkyParametersPartOfURL,
    linkedInParametersPartOfURL,
    threadsParametersPartOfURL,
  ],
  ([
    encodedLinkToShare,
    twitterParametersPartOfURL,
    emailParametersPartOfURL,
    whatsAppParametersPartOfURL,
    blueSkyParametersPartOfURL,
    linkedInParametersPartOfURL,
    threadsParametersPartOfURL,
  ]: [string, string, string, string, string, string, string]) => [
    {
      platform: "Facebook" as ShareTargets,
      shareLink: `https://www.facebook.com/sharer/sharer.php?u=${encodedLinkToShare}`,
    },
    {
      platform: "Twitter / X" as ShareTargets,
      shareLink: `https://x.com/intent/tweet?url=${encodedLinkToShare}${twitterParametersPartOfURL}`,
    },
    {
      platform: "WhatsApp" as ShareTargets,
      shareLink: `https://wa.me/?text=${whatsAppParametersPartOfURL}`,
    },
    {
      platform: "Facebook Messenger" as ShareTargets,
      shareLink: `fb-messenger://share?link=${encodedLinkToShare}`,
    },
    {
      platform: "Email" as ShareTargets,
      shareLink: `mailto:?${emailParametersPartOfURL}`,
    },
    {
      platform: "Blue Sky" as ShareTargets,
      shareLink: `https://bsky.app/intent/compose?text=${blueSkyParametersPartOfURL}`,
    },
    {
      platform: "LinkedIn" as ShareTargets,
      shareLink: `https://www.linkedin.com/feed/?shareActive=true&text=${linkedInParametersPartOfURL}`,
    },
    {
      platform: "Threads" as ShareTargets,
      shareLink: `https://www.threads.net/intent/post?${threadsParametersPartOfURL}`,
    },
  ]
);
