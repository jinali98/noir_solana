[ReadMe is WIP]

please note that targert folder is pushed only for demo purposes

with sunspot we can verify noir based zk proof inside solana blockchain.

steps to run the project:

Follow the instructions to install sunspot:
https://github.com/reilabs/sunspot

once sunspot is installed, you can create a new project using nargo:
```
nargo new simple_sum
```

this will create a new directory called simple_sum with a main.nr file and a Nargo.toml file.

once the circuit is created you can generate Prover.toml file using:
```
nargo check
```
now add the valid values to the Prover.toml file based on the circuit constraints

you can then compile the project using:
```
nargo execute
```
this will compile the project and convert noir to ACIR bytecode and create a witness.

now its time to convert this project so we can verify the proof inside solana blockchain.
