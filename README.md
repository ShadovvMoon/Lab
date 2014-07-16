Lab
===

A lab server for the nodejs implementation of the iLab Shared Architecture

For more information, please see the [instruction manual](http://www.samuco.net/ilab/manual.pdf)

###Purpose
The new lab server provides a similar service to the original MIT lab server, but is designed to be more lightweight, flexible, easier to setup and to minimise effort required to tailor it to your specific lab equipment. It is also platform independent while the original MIT lab server is restricted to Windows. The nodejs lab server is designed to work with [modern service brokers](https://github.com/ShadovvMoon/Broker)

###Installation
```
cd <path to lab directory>
npm install
node index.js
```

Once the lab server is started (see installation), press return or enter to start the interactive lab setup process. Type in the port number for which you want the lab server to run on, then press enter or return. Assuming the port is available, information about modules will be printed out, followed by the administrator login.
Open a web browser and navigate to http://localhost:**port**, where port is the port number you typed into the setup process. Login with the username and **password provided in the setup**. Click the Admin drop down menu in the upper right hand corner and then select **My Profile**. Enter the **password provided in the setup** as the old password, then type in a new password and click **Save**.
Click on the **General** link in the sidebar. Type in a name for your lab server, generate a UID and then click Save