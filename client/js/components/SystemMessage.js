class SystemMessage extends HTMLElement
{
    constructor()
    {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback()
    {
        const style = document.createElement('style');
        style.textContent = `
            .system-message
            {   
                background: hsl(219, 40%, 12%);
                padding: 0.5rem 1.2rem;
                color: white;
                font-weight: 400;
                font-size: 0.9rem;
                text-align: center;
                margin: 1rem auto;
                width: max-content;
                border-radius: 100vw;
                max-width: 70%;
            }
        `;
        
        const div = document.createElement('div');
        div.classList.add('system-message');
        div.textContent = this.getAttribute('content');


        this.shadowRoot.append(style, div);
    }
}

customElements.define('system-message', SystemMessage);
