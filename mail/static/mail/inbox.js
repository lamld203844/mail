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

function compose_email(...pre) {
  // log pre
  console.log(pre);

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#each-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // pre-fill if reply, clear out by default
  // send to
  document.querySelector('#compose-recipients').value = (pre[0].sender === undefined) ?
  '' :
  pre[0].sender;

  // subject
  let sub_e = '';
  if (pre[0].subject !== undefined) {

    // add string 'Re: ' (if not already have)
    const first3 = pre[0].subject.trim().slice(0, 3);
    sub_e = (first3.toUpperCase() === 'RE:') ? pre[0].subject : `Re: ${pre[0].subject}`;
  }
  document.querySelector('#compose-subject').value = sub_e;

  // body
  document.querySelector('#compose-body').value = (pre[0].body === undefined) ?
  '' :
  `"On ${pre[0].timestamp}, ${pre[0].sender} wrote: ${pre[0].body}"`;

}

async function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#each-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear every time loading
  document.querySelector('#emails-view').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get all entries of mailbox
  const response = await fetch(`/emails/${mailbox}`);

  const emails = await response.json();

  
  // Add email to 'emails view' (should replacing by React in future)
  // encapsulate all mails to a un-order list
  const ul = document.createElement('ul');
  ul.className = 'list-group';

  emails.forEach(email => {
    
    // item of list
    const element = document.createElement('li');
    // if unread, gray background
    element.className = email.read ? 'btn btn-outline-dark' : 'btn btn-dark';

    // row for diving grid in Boostrap
    const div = document.createElement('div');
    div.className = 'row';
    element.append(div);

    // sender
    const div_sender = document.createElement('div');
    div_sender.innerHTML = (mailbox === 'sent') ? email.recipients : email.sender;
    div_sender.className = 'col-3  list-div-sender';
    div.append(div_sender);

    // subject
    const div_subject = document.createElement('div');
    div_subject.innerHTML = email.subject;
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

      // archive button col-2
      const archive = document.createElement('div');
      archive.id = email.id;
      const innerContent = (mailbox === 'archive') ? 'unarchive' : 'archive';
      archive.innerHTML = `<button type="button" 
      class="archive btn btn-sm btn-outline-secondary">${innerContent}</button>`;

      archive.addEventListener('click', event => archiveMail(event));
      div.append(archive);
    };

    // timestamp
    const div_timestamp = document.createElement('div');
    div_timestamp.innerHTML = email.timestamp;
    div_timestamp.className = 'col-3 list-div-timestamp';
    div.append(div_timestamp);

    // View mail function
    const id = email.id;
    element.id = id;
    element.addEventListener('click', () => viewEmail(id, event, mailbox));

    // Add encapsulating list element to ul
    ul.append(element);

  });

  document.querySelector('#emails-view').append(ul);

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

            // alert content
            announce.innerHTML = result.message;
      
            // Load sent mailbox
            load_mailbox('sent');
      
            // Clear status sending after 5s
            setTimeout(() => {
              document.querySelector('.alert').remove();
            },5000);
    })
  })
  .catch(error => console.log(error));

}

function viewEmail(id, event, fromMailbox){

  // view mail if user click on mail (except archive button)
  if (event.target.className !== 'archive btn btn-sm btn-outline-secondary') {

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

        if (fromMailbox !== 'sent') {
          
          // reply button (non-existing in sent mailbox)
          const reply = document.createElement('button');
          reply.className = 'btn btn-sm btn-outline-primary';
          reply.innerHTML = 'Reply';
          // When click on Reply button, compose with pre-fill
          reply.addEventListener('click', () => compose_email(result));
          head.append(reply);

        }
        
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