// Verify the mail configuration by connecting and authenticating to SMTP.
// Run with: npm run check:email
//
// hunting@m77ag.com and office@m77ag.com are shared Microsoft 365 mailboxes.
// A shared mailbox has no licence or password, so SMTP authenticates as a
// licensed account holding "Send As" permission on it, and the shared address
// goes in the From header.
require('dotenv').config();

const { verifyMailConfiguration, describeMailSources } = require('../utils/emailservice');

(async () => {
  console.log('Checking mail configuration...\n');

  const sources = describeMailSources();
  console.log('Resolved from these environment variables:');
  console.log(`  SMTP host:         ${sources.host}`);
  console.log(`  SMTP port:         ${sources.port}`);
  console.log(`  Provider shortcut: ${sources.service}`);
  console.log(`  Hunting auth user: ${sources.huntingAuth}`);
  console.log(`  Hunting From:      ${sources.huntingFrom}\n`);

  const results = await verifyMailConfiguration();
  let failed = 0;

  for (const result of results) {
    console.log(`${result.mailbox.toUpperCase()} MAILBOX`);
    console.log(`  SMTP server:       ${result.host}`);
    console.log(`  Authenticates as:  ${result.authenticatesAs}`);
    console.log(`  Sends as:          ${result.sendsAs}`);

    if (result.ok) {
      console.log('  Result:            OK - authenticated and ready to send\n');
    } else {
      failed++;
      console.log(`  Result:            FAILED - ${result.error}\n`);
    }
  }

  if (failed) {
    console.log('One or more mailboxes cannot send. Common causes on Microsoft 365:');
    console.log('  - SMTP AUTH is disabled for the tenant or for the sending account.');
    console.log('    Enable it per mailbox in the Microsoft 365 admin center, or use');
    console.log('    an account where it is enabled.');
    console.log('  - Authenticating directly as the shared mailbox. Shared mailboxes');
    console.log('    have no password; authenticate as a licensed account that has');
    console.log('    Send As permission and set HUNTING_FROM_ADDRESS instead.');
    console.log('  - Basic authentication blocked by a conditional access policy.');
    console.log('  - Wrong host. Microsoft 365 is smtp.office365.com port 587.');
    console.log('    Set MAIL_HOST and MAIL_PORT, or MAIL_SERVICE=gmail for Google.\n');
    process.exit(1);
  }

  console.log('All mailboxes authenticated successfully.');
  process.exit(0);
})();
