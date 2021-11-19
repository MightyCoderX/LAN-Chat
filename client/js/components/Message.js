class ChatMessage extends HTMLElement
{
    constructor()
    {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback()
    {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="css/message.css">
            <div class="message-container ${ this.hasAttribute('self') ? 'self' : ''}">
                <div class="message">
                    <p class="username" id="username"></p>
                    <p class="content" id="content"></p>
                    <small class="timestamp">${this.getAttribute('timestamp')}</small>
                </div>
            </div>
        `;

        this.shadowRoot.getElementById('username').textContent = this.getAttribute('username');

        if(this.hasAttribute('content'))
        {
            this.shadowRoot.getElementById('content').innerHTML = 
                marked.marked(escapeHtml(this.getAttribute('content')));
        }

        if(this.hasAttribute('img'))
        {
            const image = document.createElement('img');
            image.loading = 'lazy';
            image.src = this.getAttribute('img');
            
            this.shadowRoot.querySelector('.message').appendChild(image);

            image.addEventListener('click', e =>
            {
                openImage(image.src);
            });
        }
    }
}

function escapeHtml(text)
{
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

customElements.define('chat-message', ChatMessage);