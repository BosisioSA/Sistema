auth.login("admin","hbK7#^n$Ik7*E&_");


var lUsers=users.list_users();
var lQueueEntryId = 0;
for (i=0; i<lUsers.length; i++)
{
	lQueueEntryId++;
	lEmail=lUsers[i].email;

	var lReg=registration.list(["email","equal to",lEmail]);

	if (lReg.results.length==0)
	{
		print(lEmail + ': no registration');
		continue;
	}

	var lIndex;
	for (lIndex = 0; lIndex < lReg.results.length; lIndex += 1)
	{
	if (lReg.results[lIndex]["enabled"]==0)
	{
	print(lEmail + ': enabled = ' + lReg.results[0]["enabled"]);
	
		lPath="PP_FILE_STORE/Users/"+lEmail+"/layout";
		lAsset=assets.get_with_url(lPath,"");
	
		lSheet=lAsset["contents"]["layout"]["sheets"][0];
	
		lFiles=[];
		lContents=lSheet["contents"];
		for(j=0; j<lContents.length; j++)
		{
			lURL=lContents[j]["url"];
			lFiles.push(lURL);
		}

	

		//print(JSON.stringify(lFiles));

		for (k=0; k<2; k++)
		{
			var l_input =
  				[ 'JOBDESCRIPTION',
     					[ 'PAGEORDER'
      					],
     					[ 'JOBTICKETS',
          					[ 'JTF', {filename: 'job.jtf'} ]
      					],
     					[ 'PARAMETERS',
						[ 'PARAMETER', {name: lEmail} ]
					],
      					[ 'CONTACTS',
          					[ 'CONTACT', {name: lEmail},
              						[ 'PARAMETERS' ,
								[ 'PARAMETER', {key: 'type', value: 'Sender'} ]	
             						],
              						[ 'COMCHANNELS'
							]
						]
					]
				];


			if (lReg.results[lIndex].lastname != undefined && lReg.results[lIndex].lastname != '')
			{
				l_input[3].push(
					[ 'PARAMETER', {key: 'customerJobName', value: lReg.results[lIndex]["lastname"] } ]
				);
			}

			if (lReg.results[lIndex].name != undefined && lReg.results[lIndex].name != '')
			{
				l_input[3].push(
					[ 'PARAMETER', {key: 'customerProjectId', value: lReg.results[lIndex]["name"] } ]
				);
			}

			if (lReg.results[lIndex].city != undefined && lReg.results[lIndex].city != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'city', value: lReg.results[lIndex]["city"] } ]
				);
			}

			if (lReg.results[lIndex].company != undefined && lReg.results[lIndex].company != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'company', value: lReg.results[lIndex]["company"] } ]
				);
			}

			if (lReg.results[lIndex].zipcode != undefined && lReg.results[lIndex].zipcode != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'zipCode', value: lReg.results[lIndex]["zipcode"] } ]
				);
			}


			if (lReg.results[lIndex].title != undefined && lReg.results[lIndex].title != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'jobTitle', value: lReg.results[lIndex]["title"] } ]
				);
			}


			if (lReg.results[lIndex].country != undefined && lReg.results[lIndex].country != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'country', value: lReg.results[lIndex]["country"] } ]
				);
			}

			if (lReg.results[lIndex].cellphone != undefined && lReg.results[lIndex].cellphone != '')
			{
				l_input[4][1][3].push(
					[ 'COMCHANNEL', [ 'PARAMETERS', 
						[ 'PARAMETER', {key: 'locator', value: lReg.results[lIndex]["cellphone"] } ],
						[ 'PARAMETER', {key: 'details', value: 'mobile' } ],
						[ 'PARAMETER', {key: 'type', value: 'phone' } ]
					] ]
				);
			}

			if (lReg.results[lIndex].workphone != undefined && lReg.results[lIndex].workphone != '')
			{
				l_input[4][1][3].push(
					[ 'COMCHANNEL', [ 'PARAMETERS', 
						[ 'PARAMETER', {key: 'locator', value: lReg.results[lIndex]["workphone"] } ],
						[ 'PARAMETER', {key: 'details', value: 'landLine' } ],
						[ 'PARAMETER', {key: 'type', value: 'phone' } ]
					] ]
				);
			}

			if (lReg.results[lIndex].state != undefined && lReg.results[lIndex].state != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'state', value: lReg.results[lIndex]["state"] } ]
				);
			}

			if (lReg.results[lIndex].street != undefined && lReg.results[lIndex].street != '')
			{
				l_input[4][1][2].push(
					[ 'PARAMETER', {key: 'address', value: lReg.results[lIndex]["street"] } ]
				);
			}

			if (k==0)
			{		
				//lJDML="out/"+lEmail+"_job.xml";
				lJDML = "i:/portal/files/Users/" + lEmail + "/job.jdml";
				l_input[1].push(
					[ 'INPUTFILE', {filename: 'output.pdf'} ]
				);
			} else
			{
				//lJDML="out/"+lEmail+"_files.xml";
				lJDML = "i:/portal/files/Users/" + lEmail + "/job1.jdml";
				for (p=0; p<lFiles.length; p++)
				{
					lParts=lFiles[p].split("/");
					lFile=lParts[lParts.length-1];
					l_input[1].push(
						[ 'INPUTFILE', {filename: lFile } ]
					);				
				}
	
			}		
			
			print(lJDML);
			var l_output = "<?xml version='1.0' ?>";
			l_output += utils.xml.write(l_input).xml;
			utils.file.write_string(lJDML,l_output);
		}
	}
	}
}