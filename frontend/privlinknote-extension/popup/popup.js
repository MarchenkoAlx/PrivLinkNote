(function () {
  const form = document.getElementById("privlink-form");
  const showPasswordInput = document.getElementById("show-password");
  const getLinkButton = document.getElementById("getLink");
  const resultMessage = document.getElementById("result-message");
  const inputContainer = document.getElementById("password-inputs");

  const baseUrl = "https://sec2link.maappdev.workers.dev";

  getLinkButton.addEventListener("click", function () {
    const linkCodeInput = document.getElementById("linkCode");
    const passwordInput = document.getElementById("password");
    const contentInput = document.getElementById("content");

    resultMessage.style.display = "none";

    if (!linkCodeInput.value) {
      return;
    }

    fetch(`${baseUrl}/${linkCodeInput.value}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        password: showPasswordInput.checked ? passwordInput.value : null,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        linkCode.value = "";
        passwordInput.value = "";
        if (data.content) {
          contentInput.value = "";
          contentInput.value = data.content;
        } else {
          resultMessage.style.display = "block";
          resultMessage.innerHTML = data.status;
        }
      })
      .catch((error) => {
        console.error("Error", error);
      });
  });

  showPasswordInput.addEventListener("change", function () {
    inputContainer.style.display = this.checked ? "flex" : "none";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm-password");
    const content = document.getElementById("content");

    resultMessage.style.display = "none";

    if (showPasswordInput.checked && password.value !== confirmPassword.value) {
      resultMessage.style.display = "block";
      resultMessage.innerHTML = "Passwords do not match.";
      return;
    }

    fetch(`${baseUrl}/privlink/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content.value,
        password: showPasswordInput.checked ? password.value : null,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        resultMessage.style.display = "block";
        if (data.result === "success") {
          resultMessage.innerHTML = `Your short code: <a href="#">${data.shortLink}</a> <button id="copy-link">Copy</button>`;
          content.value = "";
          password.value = "";
          confirmPassword.value = "";
          showPasswordInput.checked = false;
          inputContainer.style.display = "none";
          document
            .getElementById("copy-link")
            .addEventListener("click", function () {
              copyToClipboard(data.shortLink);
              resultMessage.innerHTML = "Link copied to clipboard.";
            });
        } else {
          resultMessage.innerHTML = data.status;
        }
      })
      .catch((error) => console.log("Error", error));
  });

  // Create copy to clipboard functionality
  const copyToClipboard = (text) => {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  };
})();
