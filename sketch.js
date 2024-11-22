let chatHistory = [];
let inputField;
let submitButton;
let chatContainer;
const proxyURL = "https://replicate-api-proxy.glitch.me/create_n_get/";

let conversationHistory = [];

// Setup function for chat interface and animations
function setup() {
  // Create canvas for layout purposes
  createCanvas(windowWidth, windowHeight).position(0, 0).style("z-index", "-1");
noLoop(); // To prevent continuous re-drawing

  // Apply global background
  document.body.style.background = "linear-gradient(120deg, #1e90ff, #87ceeb)";
  

  // Create the unlock button
  let unlockButton = createButton("Start");
  unlockButton.style("padding", "20px 40px");
  unlockButton.style("font-size", "24px");
  unlockButton.style("background-color", "#007BFF");
  unlockButton.style("color", "#fff");
  unlockButton.style("border", "none");
  unlockButton.style("border-radius", "10px");
  unlockButton.style("cursor", "pointer");
  unlockButton.position(windowWidth / 2 - unlockButton.size().width / 2, windowHeight / 2 - unlockButton.size().height / 2);
  unlockButton.center("both"); // Center the button
  unlockButton.mousePressed(unlockChat);

  // Chat container (initially hidden)
  chatContainer = createDiv("");
  chatContainer.id("chat-container");
  chatContainer.style("max-height", "3000px");
  chatContainer.style("overflow-y", "auto");
  chatContainer.style("padding", "10px");
  chatContainer.style("border", "1px solid #ccc");
  chatContainer.style("margin-bottom", "10px");


  chatContainer.style("background-color", "#f9f9f9");
  chatContainer.style("display", "none"); // Initially hidden
  chatContainer.style("width", "650px"); // Fixed width


  // Input container (initially hidden)
  let inputContainer = createDiv("");
  inputContainer.class("input-container");
  inputContainer.style("display", "none"); // Initially hidden
  inputContainer.style("margin-top", "10px");

  // Input field
  inputField = createInput("");
  inputField.style("width", "40%");
  inputField.style("padding", "10px");
  inputField.style("font-size", "16px");
  inputField.parent(inputContainer);

  // Submit button
  submitButton = createButton("Send");
  submitButton.style("padding", "10px 20px");
  submitButton.style("font-size", "16px");
  submitButton.style("margin-left", "10px");
  submitButton.parent(inputContainer);
  submitButton.mousePressed(handleSubmit);

  // Template button for daily plan
  let templateButton = createButton("Insert Template");
  templateButton.style("padding", "10px 20px");
  templateButton.style("font-size", "16px");
  templateButton.style("margin-left", "10px");
  templateButton.parent(inputContainer);
  templateButton.mousePressed(() => {
    inputField.value(
      "I need to complete the following tasks: 1.___ 2.___ 3.___.Time begain:___. Time end:___. Please give me a plan."
    );
  });


  // Add chat container and input container to the body
  chatContainer.parent(document.body);
  inputContainer.parent(document.body);

  // Enable Enter key for submission
  inputField.elt.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  });

  // Unlock chat interface when button is pressed
  function unlockChat() {
    chatContainer.style("display", "block");
    inputContainer.style("display", "block");
    unlockButton.remove(); // Remove the unlock button after clicking
  }
}

// Add messages to the chat interface
function addMessageToChat(message, isUser) {
  let messageDiv = createDiv("");
  messageDiv.parent(chatContainer);
  messageDiv.class("message");
  messageDiv.addClass(isUser ? "user-message" : "bot-message");

  messageDiv.html(`
    <div class="message-header">
      <strong>${isUser ? "You" : "Bot"}</strong>
    </div>
    <div class="message-content">
      ${message}
    </div>
  `);

  chatContainer.elt.scrollTop = chatContainer.elt.scrollHeight;
  return messageDiv;
}

// Handle user input submission
async function handleSubmit() {
  const inputValue = inputField.value();
  if (!inputValue) return;

  inputField.value("");
  addMessageToChat(inputValue, true);
  conversationHistory.push({ role: "user", content: inputValue });

  document.body.style.cursor = "progress";
  submitButton.attribute("disabled", "");
  const loadingMessage = addMessageToChat("loading...", false);

  try {
    const response = await getChatResponse(conversationHistory);
    loadingMessage.remove();
    addMessageToChat(response, false);
    conversationHistory.push({ role: "assistant", content: response });
    chatHistory.push({ prompt: inputValue, response: response });
  } catch (error) {
    console.error("Error:", error);
    loadingMessage.remove();
    addMessageToChat("Error processing your request.", false);
  }

  document.body.style.cursor = "default";
  submitButton.removeAttribute("disabled");
}

// Get chatbot response using API
async function getChatResponse(history) {
  let formattedHistory = "<|begin_of_text|>";
  for (let i = 0; i < history.length; i++) {
    const message = history[i];
    if (message.role === "user") {
      formattedHistory += `<|start_header_id|>user<|end_header_id|>\n${message.content}<|eot_id|>`;
    } else if (message.role === "assistant") {
      formattedHistory += `<|start_header_id|>assistant<|end_header_id|>\n${message.content}<|eot_id|>`;
    }
  }
  formattedHistory += `<|start_header_id|>assistant<|end_header_id|>`;

  const data = {
    modelURL:
      "https://api.replicate.com/v1/models/meta/meta-llama-3-70b-instruct/predictions",
    input: {
      prompt: formattedHistory,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  };

  const raw_response = await fetch(proxyURL, options);
  const json_response = await raw_response.json();
  return json_response.output.join("").trim();
}



