document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Sending form
  document.querySelector('#compose-view').addEventListener('submit', event => sendMail(event));
    
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#show-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#show-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show all entries of mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      
      // Add email to 'emails view' (should replacing by React in future)
      // encapsulate all mails to a list
      const list = document.createElement('ul');
      list.className = 'list-group';

      for (email in emails){
        // item of ul (div in li tag)
        const element = document.createElement('li');
        // if unread, gray background
        emails[email].read ? element.className = 'btn btn-outline-dark' :
          element.className = 'btn btn-dark';

        const div = document.createElement('div');
        div.className = 'row';
        element.append(div);

        // sender
        const div_sender = document.createElement('div');
        mailbox === 'sent' ? div_sender.innerHTML = emails[email].recipients
        : div_sender.innerHTML = emails[email].sender;
        div_sender.className = 'col-3  list-div-sender';
        div.append(div_sender);
        
        // subject
        const div_subject = document.createElement('div');
        div_subject.innerHTML = emails[email].subject;
        div_subject.className = 'col-2 list-div-subject';
        div.append(div_subject);
        
        // boostrap col-3
        const div_col = document.createElement('div');
        div_col.className = 'col-4';
        div.append(div_col);

        // timestamp
        const div_timestamp = document.createElement('div');
        div_timestamp.innerHTML = emails[email].timestamp;
        div_timestamp.className = 'col-3 list-div-timestamp';
        div.append(div_timestamp);

        // event when click on list
        element.addEventListener('click', event => viewEmail(event) );

        list.append(element);
      }

      document.querySelector('#emails-view').append(list);

  });
}

function sendMail(event){
  // Notes:  By default, form submits to current URL
  // So here we prevent default and use Fetch API instead to submit
  event.preventDefault();

  //Get data from form
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // POST request
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);

      // Successfully alert

      // Load sent mailbox
      load_mailbox('sent');
  });
}

function viewEmail(event){
  console.log('detailed email');
}