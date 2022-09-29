document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Sending mail
  document.querySelector('#compose-view').addEventListener('submit', event => sendMail(event));
    
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#each-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#each-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear every time load
  document.querySelector('#emails-view').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show all entries of mailbox (unarchive)
  const response = await fetch(`/emails/${mailbox}`);

  const emails = await response.json();

  
  // Add email to 'emails view' (should replacing by React in future)
  // encapsulate all mails to a list
  const list = document.createElement('ul');
  list.className = 'list-group';

  for (email in emails){

      // item of ul (li tag (including div) )
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

      // archive button (not apply for sent mailbox)
      if (mailbox === 'sent') {

        // NULL boostrap col-4
        const div_col = document.createElement('div');
        div_col.className = 'col-4';
        div.append(div_col);

      } else {
        
        // NULL boostrap col-2
        const div_col = document.createElement('div');
        div_col.className = 'col-2';
        div.append(div_col);

        // archive button
        const archive = document.createElement('div');
        archive.id = emails[email].id;
        (mailbox === 'archive') ? innerContent = 'unarchive' : innerContent = 'archive';
        archive.innerHTML = `<button type="button" class="archive btn btn-sm btn-outline-secondary">${innerContent}</button>`;
        archive.addEventListener('click', event => archiveMail(event));
        div.append(archive);
      };

      // timestamp
      const div_timestamp = document.createElement('div');
      div_timestamp.innerHTML = emails[email].timestamp;
      div_timestamp.className = 'col-3 list-div-timestamp';
      div.append(div_timestamp);

      // Event when click on each email
      const id = emails[email].id;
      element.id = id;
      element.addEventListener('click', function() {
        viewEmail(id, event);
      });

      list.append(element);
  }

  document.querySelector('#emails-view').append(list);

}

async function sendMail(event){
  // Notes:  By default, form submits to current URL
  // So here we prevent default and use Fetch API to control the submit
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
  .then(response => {
    
    // Successfully alert
    const announce = document.createElement('div');
    response.ok ? announce.className = 'alert alert-success' : 
    announce.className = 'alert alert-danger';
    announce.setAttribute('role', 'alert');
    document.querySelector('#status-sending').append(announce);

    response.json().then(result => {
            // Print result
            console.log(result);

            // alert content
            announce.innerHTML = result.message;
      
            // Load sent mailbox
            load_mailbox('sent');
      
            // Clear status sending after 5s
            setTimeout(() => {
              document.querySelector('#status-sending').remove();
            },5000);
    })
  })
  .catch(error => console.log(error));

}

function viewEmail(id, event){
  if (event.target.className !== 'archive btn btn-sm btn-outline-secondary'){

    // Show each-email-view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#each-email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Clear every time load
    document.querySelector('#each-email-view').innerHTML = '';

    // GET request each email 
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(result => {

      // header email
      const head = document.createElement('div');

        const sender = document.createElement('div')
        sender.innerHTML = `<strong>From</strong>:  ${result.sender}`;
        head.append(sender);

        const recipients = document.createElement('div')
        recipients.innerHTML = `<strong>To</strong>:  ${result.recipients}`;
        head.append(recipients);

        const subject = document.createElement('div')
        subject.innerHTML = `<strong>Subject</strong>:  ${result.subject}`;
        head.append(subject);

        const timestamp = document.createElement('div')
        timestamp. innerHTML = `<strong>Timestamp</strong>:  ${result.timestamp}`;
        head.append(timestamp);
        
      document.querySelector('#each-email-view').append(head);

      // body email 
      const body = document.createElement('div');
      body.innerHTML = `<hr> ${result.body}`;

      document.querySelector('#each-email-view').append(body);

      // Mark email as read if mail is unread
      if (result.read === false){
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
        .catch(error => console.log(error));
      }

  })
  .catch(error => console.log(error));
  }

}

function archiveMail(event){
  const element = event.target;
  if (element.className === 'archive btn btn-sm btn-outline-secondary'){
    // Print mail id
    console.log(event.target.parentElement.id);
    // log
    console.log(event.target.innerHTML === 'archive');

    // archive PUT request
    fetch(`/emails/${event.target.parentElement.id}`,{
      method: 'PUT',
      body: JSON.stringify({
        archived: event.target.innerHTML === 'archive'
      })
    })
    .catch(error => console.log(error))
    .finally(() => {

      load_mailbox('inbox');
    
    });
  }
}