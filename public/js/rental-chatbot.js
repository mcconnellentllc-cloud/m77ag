// M77 AG Rental Chatbot
// Handles rental price negotiation with minimum $1,250/month

class RentalChatbot {
  constructor() {
    this.messages = [];
    this.currentOffer = 0;
    this.minOffer = 1250;
    this.propertyAddress = '168 Hwy 59, Sedgwick, CO 80749';
    this.userName = '';
    this.conversationStage = 'initial'; // initial, awaiting_name, awaiting_offer, negotiating, accepted

    this.init();
  }

  init() {
    this.createChatWidget();
    this.attachEventListeners();
    // Don't auto-open, wait for user to click the button
  }

  createChatWidget() {
    const chatHTML = `
      <div id="rentalChatbot" class="rental-chatbot">
        <div class="chat-header">
          <div class="chat-header-content">
            <h3>M77 AG Rentals</h3>
            <p>Let's discuss your rental offer</p>
          </div>
          <button class="chat-close-btn" id="closeChatBtn">&times;</button>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-container">
          <input type="text" id="chatInput" placeholder="Type your message..." />
          <button id="chatSendBtn">Send</button>
        </div>
      </div>

      <style>
        .rental-chatbot {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 400px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 100px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: none;
          flex-direction: column;
          z-index: 9999;
          font-family: 'Inter', sans-serif;
        }

        .rental-chatbot.open {
          display: flex;
        }

        .chat-header {
          background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%);
          color: white;
          padding: 20px;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-content h3 {
          margin: 0;
          font-size: 18px;
          color: #d4af37;
        }

        .chat-header-content p {
          margin: 5px 0 0 0;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }

        .chat-close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s;
        }

        .chat-close-btn:hover {
          opacity: 0.7;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .chat-message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.5;
          font-size: 14px;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-message.bot {
          align-self: flex-start;
          background: #f0f0f0;
          color: #1a1a1a;
        }

        .chat-message.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%);
          color: white;
        }

        .chat-input-container {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid #e0e0e0;
        }

        #chatInput {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }

        #chatInput:focus {
          outline: none;
          border-color: #2d5016;
        }

        #chatSendBtn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #d4af37 0%, #c49d2f 100%);
          color: #1a1a1a;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }

        #chatSendBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
        }

        .chat-button-option {
          display: inline-block;
          margin: 5px;
          padding: 8px 16px;
          background: white;
          color: #2d5016;
          border: 2px solid #2d5016;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .chat-button-option:hover {
          background: #2d5016;
          color: white;
        }

        @media (max-width: 768px) {
          .rental-chatbot {
            width: calc(100vw - 20px);
            height: calc(100vh - 100px);
            right: 10px;
            bottom: 10px;
          }
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  attachEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');

    chatSendBtn.addEventListener('click', () => this.sendMessage());
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    closeChatBtn.addEventListener('click', () => this.closeChat());
  }

  openChat() {
    const chatbot = document.getElementById('rentalChatbot');
    chatbot.classList.add('open');

    if (this.messages.length === 0) {
      // Initial greeting
      this.addBotMessage(`Hello! Welcome to M77 AG Rentals. I'm here to help you with our property at ${this.propertyAddress}.`);

      setTimeout(() => {
        this.addBotMessage(`We're currently accepting rental offers of $1,250/month or higher. This is a 2-bedroom house with all utilities included, pet friendly, and available immediately.`);
      }, 1000);

      setTimeout(() => {
        this.addBotMessage(`Before we discuss your offer, what's your name?`);
        this.conversationStage = 'awaiting_name';
      }, 2000);
    }

    // Focus on input
    setTimeout(() => {
      document.getElementById('chatInput').focus();
    }, 500);
  }

  closeChat() {
    const chatbot = document.getElementById('rentalChatbot');
    chatbot.classList.remove('open');
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    this.addUserMessage(message);
    input.value = '';

    // Process message based on conversation stage
    setTimeout(() => {
      this.processMessage(message);
    }, 500);
  }

  addUserMessage(text) {
    this.messages.push({ type: 'user', text });
    this.renderMessage('user', text);
  }

  addBotMessage(text) {
    this.messages.push({ type: 'bot', text });
    this.renderMessage('bot', text);
  }

  renderMessage(type, text) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  processMessage(message) {
    const messageLower = message.toLowerCase();

    switch (this.conversationStage) {
      case 'awaiting_name':
        this.userName = message;
        this.addBotMessage(`Nice to meet you, ${this.userName}! Now, what monthly rent would you like to offer for this property?`);
        this.conversationStage = 'awaiting_offer';
        break;

      case 'awaiting_offer':
        this.handleOffer(message);
        break;

      case 'negotiating':
        this.handleOffer(message);
        break;

      case 'accepted':
        this.addBotMessage(`Your offer has already been accepted! Please proceed to the application form when you're ready.`);
        break;

      default:
        this.addBotMessage(`I'm here to help you make an offer on our rental property. What would you like to know?`);
    }
  }

  handleOffer(message) {
    // Extract number from message
    const offerMatch = message.match(/\d+/);

    if (!offerMatch) {
      this.addBotMessage(`I didn't catch a number there. Could you please tell me your monthly rent offer as a number? For example: "1300" or "$1,300/month"`);
      return;
    }

    const offer = parseInt(offerMatch[0]);
    this.currentOffer = offer;

    if (offer < this.minOffer) {
      // Negotiate
      const difference = this.minOffer - offer;
      this.addBotMessage(`Thank you for your offer of $${offer}/month, ${this.userName}. Unfortunately, that's below our minimum acceptable rent of $${this.minOffer}/month.`);

      setTimeout(() => {
        if (difference <= 100) {
          this.addBotMessage(`You're very close! Would you be able to offer $${this.minOffer}/month? That's only $${difference} more per month, and includes all utilities, making it a great value.`);
        } else if (difference <= 250) {
          this.addBotMessage(`The minimum we can accept is $${this.minOffer}/month. This includes all utilities (water, electricity, gas, trash), which typically saves tenants $150-200/month. Would you consider $${this.minOffer}/month?`);
        } else {
          this.addBotMessage(`Our minimum rent is $${this.minOffer}/month, which includes all utilities and is competitively priced for this area. Would you be interested at $${this.minOffer}/month?`);
        }
        this.conversationStage = 'negotiating';
      }, 1500);

    } else if (offer >= this.minOffer) {
      // Accept offer
      this.conversationStage = 'accepted';
      this.addBotMessage(`Excellent! I'm pleased to accept your offer of $${offer}/month, ${this.userName}!`);

      setTimeout(() => {
        this.addBotMessage(`To move forward, you'll need to complete our rental application. This includes background and credit checks ($50 application fee per adult).`);
      }, 1500);

      setTimeout(() => {
        this.addBotMessage(`Once approved, we'll send you the rental contract to review and sign. Ready to fill out the application?`);
        this.showApplicationButton();
      }, 3000);
    }
  }

  showApplicationButton() {
    const messagesContainer = document.getElementById('chatMessages');
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'chat-message bot';
    buttonDiv.innerHTML = `
      <button class="chat-button-option" onclick="window.rentalChatbot.goToApplication()">
        Fill Out Application →
      </button>
    `;
    messagesContainer.appendChild(buttonDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  goToApplication() {
    window.location.href = `/rental-application.html?offer=${this.currentOffer}`;
  }
}

// Initialize chatbot on page load
window.addEventListener('DOMContentLoaded', () => {
  window.rentalChatbot = new RentalChatbot();
});
