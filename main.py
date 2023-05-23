import subprocess
import json
import time


#---------------------------------
# INPUTS, PERSONAL ACCESS TOKEN AND REPOSITORY INFORMATION
REPO_URL = 'https://github.com/BosisioSA/Sistema.git'
ACCESS_TOKEN = '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'
USERNAME = 'BosisioSA'
REPOSITORY = 'Sistema'
BRANCH = 'main'


#EXECUTING PULL
def pull_github():
    # Define the command to execute
    cmd_pull = ["git", "pull", REPO_URL]

    # Execute command and cath the output
    result_pull = subprocess.run(cmd_pull, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    # Print output
    print(result_pull.stdout.decode())
    print(result_pull.stderr.decode())


while True:

    #---------------------------------
    #GETTING LOCAL SHA

    # Define the command to execute
    cmd_sha = ["git", "log", "-n", "1"]

    # Read the last commit
    output_local_sha = subprocess.check_output(cmd_sha)
    output_str = output_local_sha.decode('utf-8')
    local_sha = output_str.split()[1]
    #print(f"The actual SHA key of the local repository is: {local_sha}")
    print(f"{local_sha} - Local")


    #---------------------------------
    #GETTING GITHUB SHA

    # Construct the curl command as a list of strings
    cmd_remote_sha = ['curl', '-H', f'Authorization: token {ACCESS_TOKEN}', f'https://api.github.com/repos/{USERNAME}/{REPOSITORY}/branches/{BRANCH}']

    # Execute the curl command using subprocess.run()
    result = subprocess.run(cmd_remote_sha, capture_output=True, text=True)

    # Check that the command was successful
    if result.returncode == 0:
        # Parse the JSON response
        response = json.loads(result.stdout)

        # Extract the SHA key from the response
        remote_sha = response['commit']['sha']
        #print(f'The SHA key of the {branch} branch in the {username}/{repository} repository is: {remote_sha}')
        print(f"{remote_sha} - Remote")

    else:
        # Print the error message if the command was unsuccessful
        print(f'Error: {result.stderr}')

    #---------------------------------
    #SHA KEY COMPARISON


    if local_sha != remote_sha:
        pull_github()
        print("The local repository has been updated")
    else:
        print("Nothing for update")

    time.sleep(15)



#TODO Linux Console
#sudo apt-get update
#ip install PyGithub
#sudo apt-get install git
#sudo apt-get install python3-time
#sudo apt-get install python3