# Appointments + Calendar PRD

- lightweight calendar/form on frontend
  - user can select a date an hour (blocks of 1 hour)
  - dates/hours should reflect opening hours/scheduled appointments
  - user must fill in their name, email, phone number
  - user should be able to cancel their appointment (what with cookie consent?)
  
- admin component
  - admin can view appointments
  - admin can edit appointments
  - admin can manually add an appointment
  - does admin have to approve newly made appointments?

## Implementation details
- new 'appointments' table in database
- admin should get email (through Resend) of newly made appointments (use dummy email for testing)
- admin should be able to download .ical file
- user should get email (through Resend) to confirm their appointment (with link to cancel/edit)
