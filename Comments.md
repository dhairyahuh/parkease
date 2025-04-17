# To-Do

Go through the following pointers and reassess your project as early as possible. During this weekend, the first **working demo** of the project must be completed.

1. Add a **.gitignore** file to the repo.
2. Remove **client/node_modules** from the codebase in Github. Add it to **.gitignore** before pushing it on the Git Repo.
3. Remove temporary files such as _.DS_Store_ from pushed repo. Add it to **.gitignore**.
4. Place all the global constants such as configuration strings, DB connection strings etc to a global configuration file, one each for server and client apps.
5. Dockerize the app.
6. Utilize a testing library to auto test the client and server routes.
7. Make the app working ASAO with a working and connected DB. In the current state, the code is **AI-generated**. Not much effort has been put in trying to run this code which is a negative assessment for the whole group. With this level of AI generated code, it is highly expected that more effort is put in running the code.
8. Dissociate inline-styling from the elements and put the styles in external files. Import these styles in individual React components and use them.
9. How do you test that the "protected routes" are really protected?
10. What is "CORS" and why is it needed in your app?
