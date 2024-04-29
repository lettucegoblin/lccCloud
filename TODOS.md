# TODOS

## Client-Side
- [x] Implement clear button functionality
- [x] Apply basic styling w/ Tachyons
- [x] Save "IDE" code and filename to localStorage so user content isn't lost between page refreshes
- [x] Add temporary notice that din/ain/hin/sin are not currently supported
- [x] Temporarily prevent users from submitting blocking code (stdin)
- [x] Make `run` button turn into `stop` button while mid-execution of the program
- [x] Add toasts with Toastify for buttery smooth notifications, oh yeah
- [x] Pause clickability of Run button to prevent click spamming
- [ ] Let user know when client cannot communicate with server
- [ ] Save unique ID to local storage so user can continue using same files
- [ ] Save files to local storage as well for double backup

## Server-Side
- [x] Implement basic stdout
- [x] Implement stdin w/ sockets
- [x] Fix race condition issue when running multiple programs in a row
- [x] Standardize the websockets API
- [ ] Fix over-trimming of outputs
- [ ] Save files per user "session"
- [ ] Assign a unique ID to each user per "session"
- [ ] Prevent user from obtaining command line access
- [ ] Sanitize outputs so they do not include ANSI escape sequences
- [ ] Save and run files with hashed name
- [ ] Simple mongoDB for home page with published gists if people made their thing public
- [ ] Save files as gists to GitHub (see maria.cloud for reference)
- [ ] Create CI/CD pipeline so that pushing to GitHub updates code on render.com


