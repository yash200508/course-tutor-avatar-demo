const conversations = [
  {
    label: 'Explain a concept',
    turns: [
      {role:'user', text:"I don't really understand what makes an argument valid."},
      {role:'assistant', text:"Let's make it concrete. An argument is valid when the conclusion has to follow if its premises are true. Try this: every robin is a bird, and Pip is a robin. What follows about Pip?", source:0},
      {role:'user', text:'Pip is a bird, right?'},
      {role:'assistant', text:"Exactly. That conclusion follows from the premises. Validity describes that relationship; it doesn't tell us whether the premises are actually true.", source:0}
    ]
  },
  {
    label: 'Work through a misconception',
    turns: [
      {role:'user', text:'If an argument has a false premise, it cannot be valid, right?'},
      {role:'assistant', text:"That's a common mix-up. An argument can still be valid with a false premise: validity is about whether the conclusion follows from the premises. What would we call a valid argument whose premises are also true?", source:1},
      {role:'user', text:'A sound argument?'},
      {role:'assistant', text:"Yes. A sound argument is valid and has true premises. It's helpful to check those two things separately.", source:1}
    ]
  },
  {
    label: 'Ask about missing material',
    turns: [
      {role:'user', text:'What is the due date for our next assignment?'},
      {role:'assistant', text:"I don't have a due date in the material available for this example, so I can't tell you reliably. Check your course schedule or ask your instructor."}
    ]
  }
];
const sources = [
  {title:'Fictional logic handout · page 3', text:'An argument is valid when it is impossible for all its premises to be true and its conclusion false at the same time. Validity concerns the relationship between the premises and the conclusion, not whether the premises are actually true.'},
  {title:'Fictional logic handout · page 4', text:'An argument can be valid even when one of its premises is false. A sound argument is valid and has true premises.'}
];
const messages = document.querySelector('#messages');
const choices = document.querySelector('#choices');
const next = document.querySelector('#next');
const actionLabel = document.querySelector('#action-label');
const voice = document.querySelector('#voice');
let voiceEnabled = false;
let selected = null;
let position = 0;
if (!('speechSynthesis' in window)) { voice.disabled = true; voice.textContent = 'Voice unavailable'; }
voice.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  voice.setAttribute('aria-pressed', String(voiceEnabled));
  voice.textContent = voiceEnabled ? 'Turn voice off' : 'Turn voice on';
  if (!voiceEnabled) speechSynthesis.cancel();
});

function addMessage(turn) {
  const article = document.createElement('article'); article.className = `message ${turn.role}`;
  const label = document.createElement('span'); label.className = 'speaker'; label.textContent = turn.role === 'user' ? 'EXAMPLE STUDENT' : 'TUTOR';
  const body = document.createElement('p'); body.textContent = turn.text; article.append(label, body);
  if (turn.source !== undefined) {
    const section = document.createElement('div'); section.className = 'sources';
    const details = document.createElement('details'); const summary = document.createElement('summary'); const excerpt = document.createElement('blockquote');
    summary.textContent = sources[turn.source].title; excerpt.textContent = sources[turn.source].text;
    details.append(summary, excerpt); section.append(details); article.append(section);
  }
  messages.append(article); messages.scrollTop = messages.scrollHeight;
  if (turn.role === 'assistant' && voiceEnabled) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(turn.text)); }
}
function showChoices() {
  selected = null; position = 0; next.hidden = true; actionLabel.textContent = 'Choose a conversation to explore';
  choices.replaceChildren();
  conversations.forEach((conversation, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = conversation.label;
    button.addEventListener('click', () => { selected = index; position = 0; choices.replaceChildren(); messages.replaceChildren(); advance(); });
    choices.append(button);
  });
}
function advance() {
  if (selected === null) return;
  const turns = conversations[selected].turns;
  for (let i = 0; i < 2 && position < turns.length; i++) addMessage(turns[position++]);
  if (position < turns.length) { actionLabel.textContent = 'Continue this scripted example'; next.hidden = false; }
  else { showChoices(); actionLabel.textContent = 'Choose another example'; }
}
next.addEventListener('click', advance);
document.querySelector('#reset').addEventListener('click', () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); messages.replaceChildren(); addMessage({role:'assistant',text:'Hi! Pick an example below to see how a tutoring conversation could work.'}); showChoices(); });
showChoices();
