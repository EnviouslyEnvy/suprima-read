import type { Brief } from "./reading";

export const sampleTitle = "The art of paying attention";
export const sampleSource = `Attention is one of the quiet ingredients of an ordinary day. It shapes what we notice, what we remember, and which experiences become meaningful to us. Yet we often treat attention as if it were an unlimited resource. We open a message during a conversation, check a second screen during a film, or skim an article while planning the next task.

The difficulty is not simply that we have too much information. Information can be useful, interesting, and even delightful. The difficulty is that different pieces of information compete for the same moment. A useful update and a meaningless notification can demand attention with equal urgency. Without a deliberate choice, the loudest signal can win.

Consider the experience of reading something difficult. At first, the unfamiliar terms require effort. The argument may not make sense until several paragraphs have connected. If we leave after the first interruption, we may return to the words without returning to the idea. We then mistake the effort of rebuilding context for evidence that the subject is boring or beyond us.

Making space for attention does not require a perfect routine or a life without technology. It can begin with a smaller choice: selecting one thing to understand, and allowing enough time to understand it. A person might read a short section of an essay, set the phone aside for a conversation, or finish a thought before opening another tab. These choices do not eliminate distraction. They create a place to return when distraction happens.

Reading tools can help by reducing the number of decisions a reader must make at once. Clear wording can make the connection between ideas easier to follow. A measured pace can create a rhythm. A pause after a difficult sentence can provide room to think. But a tool should also make it easy to slow down, revisit a passage, and look at the original text. Moving quickly through words is not the same as understanding their meaning.

There is a tradeoff when a long passage becomes a short summary. Some repetition can be removed without much loss, while an example may be essential to understanding an abstract idea. A qualification such as "sometimes" or "under these conditions" can carry more meaning than an entire descriptive sentence. A useful summary keeps the argument and its limits, even when it leaves out much of the language around them.

The aim, then, is not to squeeze the maximum number of words into every minute. It is to give worthwhile ideas a fair chance to land. Sometimes that means reading faster through familiar material. Sometimes it means stopping after a single sentence. The right pace depends on the text, the reader, and the purpose of reading.

Attention is not something we either possess or lack. It is also something we can arrange our surroundings to support. A calmer interface, a clear next step, and permission to go slowly can make an intimidating page feel approachable. From there, the work is simple, though not always easy: choose an idea, stay with it for a little while, and see what becomes clearer.`;

export const sampleBrief: Brief = {
  title: sampleTitle,
  overview:
    "Good reading gives ideas time to land. Clear wording and a flexible pace can help.",
  sections: [
    {
      heading: "Give one idea your attention",
      text: "Attention shapes what we notice and remember. But many signals compete for the same moment. The loudest signal can win, even when another idea matters more. Choose one thing to understand. Give that idea enough time to make sense.",
      sourceSentences: [0, 1, 6, 7, 8, 15],
    },
    {
      heading: "Read for meaning",
      text: "Difficult reading takes time because ideas build on earlier ideas. An interruption can break that connection. Clear wording and a steady rhythm can make reading easier to follow. But moving quickly through words does not guarantee understanding. Slow down when an idea is unfamiliar. Revisit a sentence when its meaning is unclear.",
      sourceSentences: [10, 11, 12, 13, 19, 20, 21, 22, 23, 24],
    },
    {
      heading: "Keep the important nuance",
      text: "A useful summary keeps both an argument and its limits. Repetition may be removed. An example may be needed. Small qualifications can change a claim's meaning. The right reading pace depends on the text, the reader, and the purpose. Give yourself permission to pause. The aim is to understand worthwhile ideas.",
      sourceSentences: [25, 26, 27, 28, 29, 30, 33, 36],
    },
  ],
  takeaways: [
    "Choose one idea to understand at a time.",
    "Adjust the pace to the difficulty of the text.",
    "A shorter brief should preserve an argument's limits.",
  ],
};
