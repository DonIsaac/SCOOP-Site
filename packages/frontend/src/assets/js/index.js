$(document).ready(function () {
  console.log('Hey you, you\'re finally awake');

  $.ajax({
    method: 'GET',
    crossDomain: true,
    // dataType: 'text/ical',
    url: 'https://calendar.google.com/calendar/ical/0f163qlkupueof5qse9r78gdj8%40group.calendar.google.com/public/basic.ics'
  })
  .done(data => {
    console.log(data)
  })
})
