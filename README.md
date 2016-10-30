# Lattice-Boltzmann for Browsers

This is a simple implementation of the Lattice-Boltzmann CFD  in JavaScript for browsers, to help show how the simulation works.

Simply open index.html in browser to use.

## Running with browser-based simulation

To use browser-based simulation use the developer tools to run:

    LBUI.set_sim_helper_class(JSSimHelper);

To use a local C code (default):

- Load the lbm_server.py file in a folder with lbm code

To use another remote C code:

    LBUI.set_sim_helper_class(createRemoteSimHelper("http://<address>:8081/"))

To compare a C code and the JavaScript implementation 

    LBUI.set_sim_helper_class(createDifferenceSimHelper(createRemoteSimHelper("http://<address>:8081/"), JSSimHelper))

To compare two C codes:

    LBUI.set_sim_helper_class(createDifferenceSimHelper(createRemoteSimHelper("http://<address1>:8081/"), createRemoteSimHelper("http://<address2>:8081/")))
