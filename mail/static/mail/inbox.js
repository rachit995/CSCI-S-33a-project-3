document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#alert-error').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      const emails_view = document.querySelector('#emails-view');
      const container = document.createElement('div');
      emails_view.append(container);
      container.className = 'list-group my-3';
      emails.forEach(email => {
        const element_container = document.createElement('div');
        const isRead = email.read;
        element_container.className = 'list-group-item list-group-item-action';
        element_container.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <div class="d-flex align-items-center">
            <div class="${isRead ? '' : 'unread-dot'
          }"></div>
            <h5 class="mb-1">${email.sender}</h5>
          </div>
          <small>${email.timestamp}</small>
        </div>
        <p class="mb-1">${email.subject}</p>
        <small>${email.body}</small>
        `;
        if (isRead) {
          element_container.style.backgroundColor = '#e9ecef';
        }
        element_container.addEventListener('click', () => {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          });
          load_email(email.id);
        });
        container.append(element_container);
      });
    }
    );
}

function send_email(event) {
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(async response => {
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Something went wrong');
      }
      load_mailbox('sent');
    })
    .catch((error) => {
      document.querySelector('#alert-error').style.display = 'block';
      document.querySelector('#alert-error').innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${error}
            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"></button>
        </div>
      `;
    });
}


function load_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      const container = document.querySelector('#emails-view');
      container.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
      <button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>
      <hr>
      <p>${email.body}</p>
      `;
      if (email.archived) {
        document.querySelector('#archive').innerHTML = 'Unarchive';
      }
      document.querySelector('#reply').addEventListener('click', () => {
        reply_email(email);
      });
      document.querySelector('#archive').addEventListener('click', () => {
        archive_email(email);
      });
    });
}

function reply_email(email) {
  compose_email();
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
}

function archive_email(email) {
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
    .then(() => {
      load_mailbox('inbox');
    });
}


