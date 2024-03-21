class PrivlinkForm extends HTMLElement {
	baseUrl = 'https://sec2link.maappdev.workers.dev';

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	copyToClipboard(text) {
		const input = document.createElement('input');
		input.value = text;
		document.body.appendChild(input);
		input.select();
		document.execCommand('copy');
		document.body.removeChild(input);
	}

	// Bind event listeners
	bindEvents() {
		const form = this.shadowRoot.getElementById('privlink-form');
		const showPasswordInput = this.shadowRoot.getElementById('show-password');
		const getLinkButton = this.shadowRoot.getElementById('getLink');
		const resultMessage = this.shadowRoot.getElementById('result-message');
		const inputContainer = this.shadowRoot.getElementById('password-inputs');

		getLinkButton.addEventListener('click', () => {
			const linkCodeInput = this.shadowRoot.getElementById('linkCode');
			const passwordInput = this.shadowRoot.getElementById('password');
			const confirmPasswordInput = this.shadowRoot.getElementById('confirm-password');
			const contentInput = this.shadowRoot.getElementById('content');

			resultMessage.style.display = 'none';

			if (!linkCodeInput.value) {
				return;
			}

			fetch(`${this.baseUrl}/${linkCodeInput.value}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: contentInput.value,
					password: showPasswordInput.checked ? passwordInput.value : null,
				}),
			})
				.then(response => response.json())
				.then(data => {
					linkCodeInput.value = '';
					passwordInput.value = '';
					confirmPasswordInput.value = '';
					if (data.content) {
						contentInput.value = '';
						contentInput.value = data.content;
					} else {
						resultMessage.style.display = 'block';
						resultMessage.innerHTML = chrome.i18n.getMessage(data.status);
					}
				})
				.catch(error => {
					console.log('Error', error);
				});
		});

		showPasswordInput.addEventListener('change', function () {
			inputContainer.style.display = this.checked ? 'flex' : 'none';
		});

		form.addEventListener('submit', event => {
			event.preventDefault();
			const passwordInput = this.shadowRoot.getElementById('password');
			const confirmPasswordInput = this.shadowRoot.getElementById('confirm-password');
			const contentInput = this.shadowRoot.getElementById('content');

			resultMessage.style.display = 'none';

			if (showPasswordInput.checked && passwordInput.value !== confirmPasswordInput.value) {
				resultMessage.style.display = 'block';
				resultMessage.innerHTML = 'Passwords do not match.';
				return;
			}

			fetch(`${this.baseUrl}/privlink/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: contentInput.value,
					password: showPasswordInput.checked ? passwordInput.value : null,
				}),
			})
				.then(response => response.json())
				.then(data => {
					resultMessage.style.display = 'block';
					if (data.result === 'success') {
						resultMessage.innerHTML = `${chrome.i18n.getMessage('Your_short_code')}: <a href="#">${
							data.shortLink
						}</a> <button id="copy-link">${chrome.i18n.getMessage('Copy')}</button>`;
						contentInput.value = '';
						passwordInput.value = '';
						confirmPasswordInput.value = '';
						showPasswordInput.checked = false;
						inputContainer.style.display = 'none';
						this.shadowRoot.getElementById('copy-link').addEventListener('click', () => {
							this.copyToClipboard(data.shortLink);
							resultMessage.innerHTML = chrome.i18n.getMessage('Link_copied_to_clipboard');
						});
					} else {
						resultMessage.innerHTML = chrome.i18n.getMessage(data.status);
					}
				})
				.catch(error => console.log('Error', error));
		});
	}

	connectedCallback() {
		const __ = chrome.i18n.getMessage;
		this.shadowRoot.innerHTML = `
      <style>
      .privlink-form {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
      }

      .privlink-form input,
      textarea {
        width: 100%;
        margin: 10px 0;
        padding: 10px;
        box-sizing: content-box;
        outline: none;
        background: #fff9d5cc;
        border: none;
      }

      .privlink-form input[type="checkbox"] {
        width: auto;
      }

      .privlink-form .input-group {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
      }
      .privlink-form .input-group label {
        margin-left: 10px;
        font-size: 1rem;
      }
      .privlink-form input[type="submit"] {
        margin: 20px 0;
        padding: 10px;
        box-sizing: content-box;
        background-color: var(--text-color);
        color: var(--bg-color);
        border: none;
        cursor: pointer;
        text-transform: uppercase;
        font-weight: 700;
      }
      .privlink-form button {
        padding: 10px;
        box-sizing: content-box;
        background-color: var(--text-color);
        color: var(--bg-color);
        border: none;
        cursor: pointer;
        text-transform: uppercase;
        font-weight: 700;
        width: 100%;
      }
      .privlink-form .password-inputs {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        display: none;
        width: 100%;
      }

      .result-message {
        padding: 10px 10px;
        background: #00d7f8cc;
        margin: 0 10px;
        font-size: 1rem;
        color: #fff;
        display: none;
        font-weight: 400;
      }
      .result-message a {
        color: #fff;
        text-decoration: none;
        font-weight: bold;
        font-size: 1.2rem;
      }
      .result-message button {
        padding: 10px;
        box-sizing: content-box;
        background-color: var(--text-color);
        color: var(--bg-color);
        border: none;
        cursor: pointer;
        text-transform: uppercase;
        font-weight: 700;
      }
      </style>
      <div>
        <div class="result-message" id="result-message"></div>
        <form id="privlink-form" class="privlink-form" method="POST" novalidate>
          <input type="text" id="linkCode" name="linkCode" placeholder="${__('Your_link_code')}">
          <button id="getLink" type="button">${__('Get_Link_Content')}</button>
          <textarea id="content" name="content" rows="12" placeholder="${__(
						'Paste_your_content'
					)}" required></textarea>
          <div class="input-group">
            <input type="checkbox" id="show-password" name="show-password" value="show-password">
            <label for="show-password">${__('Set_password')}</label>
          </div>
          <div id="password-inputs" class="password-inputs">
            <input type="password" id="password" name="password" placeholder="${__(
							'Password'
						)}" required>
            <input type="password" id="confirm-password" name="confirm-password" placeholder="${__(
							'Confirm_Password'
						)}" required>
          </div>
          <input type="submit" value="${__('Create_Link')}">
        </form>
      </div>
    `;
		this.bindEvents();
	}
}

(function () {
	if (!customElements.get('privlink-form')) {
		customElements.define('privlink-form', PrivlinkForm);
	}
})();
