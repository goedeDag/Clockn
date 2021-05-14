let addresses = [];

function showError(msg) {
    $("error-box").style.border = "1px solid #ff6700";
    $("error-box").style.bakcground = "#ff66003a";
    $("error-box").style.color = "#ff6700";

    $("error-box").style.display = "block";
    $("error").innerHTML = msg;
}

// Triggers when the fileBox is clicked
$("file-box").addEventListener("click", () => {
    $("file").click();
});

// Triggers when a file is selected
$("file").addEventListener("change", (evt) => {
    $("error-box").style.display = "none";
    $("fileBoxCenter").style.display = "block";

    try {
        // Getting the seleced file
        let files = evt.target.files; 
        
        // Checking if the file is supported
        if(files[0].name.slice(files[0].name.length - 3) != "csv" && files[0].name.slice(files[0].name.length - 3) != "xls" && files[0].name.slice(files[0].name.length - 3) != "txt") {
            showError("Error: file type [" + files[0].type + "] is not supported", 0);
            $('file-detail').innerHTML = "Drop your files here or click to upload";
            $("fileImg").style.display = "inline-block";
            return;
        }

        let output = '<strong>' + escape(files[0].name) +  '</strong>';

        // Showing the file name 
        $('file-detail').innerHTML = output.replaceAll("%", " ");
        $("fileImg").style.display = "none";
    } catch(err) {
        //console.error(err);
    }
});

// Triggers when the next button is clicked
$("next").addEventListener("click", async () => {
    $("next").style.display = "none";
    try {
        $("error-box").style.display = "none";
        $("loadingBar").innerHTML = "";

        // Resetting the variables
        addresses = [];

        // Getting the selected files
        let fileInput = $("file");
        
        // Getting the first selected file
        let file = fileInput.files.item(0);
        let reader = new FileReader();

        // Checking if the file is supported
        if(file.name.slice(file.name.length - 3) != "csv" && file.name.slice(file.name.length - 3) != "xls" && file.name.slice(file.name.length - 3) != "txt") {
            showError("Error: file type [" + file.type + "] is not supported", 0);
            return;
        }
        
        if(file.name.slice(file.name.length - 3) == "xls") {
            // Get The File From The Input
            var oFile = file;
            var sFilename = file.name;
            
            // Ready The Event For When A File Gets Selected
            reader.onload = function(e) {
                var data = e.target.result;
                var cfb = XLS.CFB.read(data, {type: 'binary'});
                var wb = XLS.parse_xlscfb(cfb);
                // Loop Over Each Sheet
                wb.SheetNames.forEach(async function(sheetName) {
                    // Obtain The Current Row As CSV
                    var sCSV = XLS.utils.make_csv(wb.Sheets[sheetName]);   
                    var oJS = XLS.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);   

                    sCSV = sCSV.replaceAll('"', "").replaceAll(" ", "");

                    // Seperate each address and amount
                    addresses = sCSV.split("\n");

                    for(let i=0;i<addresses.length;i++) {
                        if(web3.utils.isAddress(addresses[i])) {
                            let balance = await web3.eth.getBalance(addresses[i]);
                            //$("addresses").innerHTML += i + ": Address: " + addresses[i] + " Balance: " + web3.utils.fromWei(balance) + " ether <br>";
                            addresses[i] = {
                                address: addresses[i],
                                balance: balance
                            };
                        }
                    }
                    console.log("Done");
                    $("filled").style.display = "block";
                    $("all").style.display = "block";
                });
            };

            // Tell JS To Start Reading The File.. You could delay this if desired
            reader.readAsBinaryString(oFile);
        } else if(file.name.slice(file.name.length - 3) != "csv" || file.name.slice(file.name.length - 3) != "txt") {
            // Reading the file
            reader.onload = async () => {
                // Getting the file data
                fileData = reader.result;
                // Removing all the spaces in the file
                fileData = fileData.replaceAll(" ", "");

                // Seperate each address and amount
                addresses = fileData.split("\r\n");
                
                let arrayLength = addresses.length;
                let trry = 0;
                $("loadingBar").style.display = "block";

                for(let i=0;i<addresses.length;i++) {
                    if(i >= (arrayLength / 10) * trry) {
                    trry += 1;
                    $("loadingBar").appendChild(document.createElement("div"));
                    }

                    if(web3.utils.isAddress(addresses[i])) {
                        let balance = await web3.eth.getBalance(addresses[i]);
                        //$("addresses").innerHTML += i + ": Address: " + addresses[i] + " Balance: " + web3.utils.fromWei(balance) + " ether <br>";
                        addresses[i] = {
                            address: addresses[i],
                            balance: balance
                        };
                    }
                }
                console.log("Done");
                $("filled").style.display = "block";
                $("all").style.display = "block";
                $("loadingBar").style.display = "none";
                $("next").style.display = "block";
            }

            reader.readAsText(file);
        }
    }
    catch(err) {
        alert("Error: Try again!");
    }
});

$("filled").addEventListener("click", () => {
    $("filled").style.display = "none";
    $("all").style.display = "none";
    $("next").style.display = "none";
    setTimeout(() => {
        for(let i=0;i<addresses.length-1;i++) {
            if(addresses[i].balance > 0) {
                $("addresses").innerHTML += i + ": Address: " + addresses[i].address + " Balance: " + web3.utils.fromWei((addresses[i].balance).toString()) + " ether <br>";
            }
        }
        $("filled").style.display = "block";
        $("all").style.display = "block";
        $("next").style.display = "block";
    }, 100);
});

$("all").addEventListener("click", () => {
    $("filled").style.display = "none";
    $("all").style.display = "none";
    $("next").style.display = "none";

    setTimeout(() => {
        for(let i=0;i<addresses.length-1;i++) {
            $("addresses").innerHTML += i + ": Address: " + addresses[i].address + " Balance: " + web3.utils.fromWei((addresses[i].balance).toString()) + " ether <br>";
        }
        $("filled").style.display = "block";
        $("all").style.display = "block";
        $("next").style.display = "block";
    }, 100);
});

// Triggers when page is loaded
window.addEventListener("load", async () => {
    // If web3 is injected connect to metamask, otherwise error
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(window.ethereum);
    } else {
        showError("Error: Web3 is not injected in browser. Try installing Metamask!");
        return;
    }
});