/**
 * Compose email function to show compose view and hide other views
 * and clear out composition fields
 *
 * @param {string} type compose email type
 * Note: This function is called when compose button is clicked
 * from the mailbox list or when reply button is clicked
 *
 * type = 'new' is used when compose button is clicked
 * type = 'reply' is used when reply button is clicked
 * from the email content
 */
function compose_email(type = 'new') {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#alert-error').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Set compose title based on compose email type
  if (type === 'reply') {
    document.querySelector('#compose-title').innerHTML = 'Reply';
  } else {
    // Set focus to recipients field when compose email is loaded
    document.querySelector('#compose-recipients').focus();
    document.querySelector('#compose-title').innerHTML = 'New Email';
  }
}


/**
 * Send email function to send email
 * @param {Event} event
 */
function send_email(event) {
  // Prevent default form submission
  event.preventDefault();

  // Send email via API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(async response => {
      // Handle response errors and show alert
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Something went wrong');
      }
      // Load sent mailbox after sending email
      load_mailbox('sent');
    })
    .catch((error) => {
      // Show alert error message
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

/**
 * DOMContentLoaded event listener to load mailbox content
 */
document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener to send email form
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

/**
 * Load mailbox function to load mailbox content
 * @param {*} mailbox mailbox name
 */
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails from API
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Get #emails-view container and create a div container inside it
      const emails_view = document.querySelector('#emails-view');
      const container = document.createElement('div');
      emails_view.append(container);
      container.className = 'list-group my-3';


      if (emails.length === 0) {
        // Create a div container for no email message
        const element_container = document.createElement('div');
        // Set class name and inner HTML for no email message container
        element_container.className = 'alert alert-info';
        element_container.innerHTML = `No emails found in ${mailbox} mailbox`;
        // Append no email message container to #emails-view container
        container.append(element_container);

      } else {
        // Loop through emails and create a div container for each email
        emails.forEach(email => {
          // Create a div container for each email
          const element_container = document.createElement('div');
          // Check if email is read
          const isRead = email.read;
          // Set class name and inner HTML for each email container
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
        <small class="text-muted">${email.body.length > 100 ? email.body.substring(0, 100) + '...' : email.body}</small>
        `;
          // Check if email is read and set background color
          if (isRead) {
            element_container.style.backgroundColor = '#e9ecef';
          }

          // Add event listener to each email container to load email content when clicked
          // and mark email as read
          element_container.addEventListener('click', () => {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                read: true
              })
            });
            // Load email content
            load_email(email.id, mailbox);
          });
          // Append each email container to #emails-view container
          container.append(element_container);
        });
      }

    }
    );
}

/**
 * Reply email function to reply email
 * @param {*} email email object
 * @param {*} mailbox mailbox name
 *
 * Note: This function is called when reply button is clicked
 * from the email content
 *
 * mailbox = 'sent' is used when reply button is clicked
 * from the email content in sent mailbox
 */
function reply_email(email, mailbox) {
  // Show compose view and hide other views
  compose_email('reply');

  // Set compose email fields based on mailbox name, if mailbox is sent then
  // set recipients field to email recipients otherwise set recipients field to email sender
  if (mailbox === 'sent') {
    document.querySelector('#compose-recipients').value = email.recipients;
  }
  else {
    document.querySelector('#compose-recipients').value = email.sender;
  }
  // if subject does not start with 'Re: ' then add 'Re: ' to subject
  document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  // Set focus to body field when reply email is loaded and set cursor to start of text
  document.querySelector('#compose-body').focus();
  document.querySelector('#compose-body').setSelectionRange(0, 0);


}

/**
 * Archive email function to archive email
 * @param {*} email email object
 *
 * Note: This function is called when archive button is clicked
 * from the email content
 */
function archive_email(email) {
  // Archive email via API
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
    .then(() => {
      // Load inbox mailbox after archiving email
      load_mailbox('inbox');
    });
}

/**
 * Load email function to load email content
 * @param {*} id email id
 * @param {*} mailbox mailbox name
 *
 * Note: This function is called when an email is clicked
 * from the mailbox list
 *
 * If mailbox is sent then archive button is not shown
 */
function load_email(id, mailbox) {
  // Fetch email from API
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Get #emails-view container and set inner HTML
      const container = document.querySelector('#emails-view');
      container.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
      ${mailbox === 'sent' ? '' :
          '<button class="btn btn-sm btn-outline-primary" id="archive">Archive</button>'
        }
      <hr>
      <p>${email.body.replace(/\n/g, "<br>")}</p >
    `;
      // Check if email is archived and set button text
      if (email.archived) {
        document.querySelector('#archive').innerHTML = 'Unarchive';
      }
      // Add event listener to reply button
      document.querySelector('#reply').addEventListener('click', () => {
        reply_email(email, mailbox);
      });
      // Add event listener to archive button
      document.querySelector('#archive').addEventListener('click', () => {
        archive_email(email);
      });
    });
}
