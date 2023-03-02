const copyToClipBoard = inputElement => {
    const text = inputElement.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(
        function () {
            window.alert("Copying to clipboard was successful!");
        },
        function (err) {
            window.alert("Could not copy text: ", err);
        });
}

const removeSpacing = inputString => {
    let string = inputString.trim();
    let charArray = string.split('');
    if (charArray.length == 0 || charArray.join('') == undefined) return
    if (charArray[0] === '\n') {
        charArray.shift();
    };
    return charArray.join('')
}

const defineProtocol = configString => {
    const configsObject = {
        "trojan": [],
        "vless": [],
        "vmess": [],
    }

    let configArray = configString.split('\n');
    configArray.forEach(config => {
        let clearConfig = removeSpacing(config);
        if (clearConfig == "" || clearConfig == undefined) return;

        if (clearConfig.includes('trojan')) {
            configsObject.trojan.push(clearConfig);
        }
        else if (clearConfig.includes('vmess')) {
            configsObject.vmess.push(clearConfig);
        }
        else if (clearConfig.includes('vless')) {
            configsObject.vless.push(clearConfig);
        }

    });
    return configsObject;
}

document.addEventListener("DOMContentLoaded", () => {
    let serverNames = document.querySelector("#serverNames");
    let configsInput = document.querySelector("#configs");
    let clear_servernames_btn = document.querySelector("#clear-servernames-btn");
    let clear_configs_btn = document.querySelector("#clear-configs-btn");

    let simpleResult = document.querySelector("#simple-result");
    let base64Result = document.querySelector("#base64-result");
    let IOSbase64Result = document.querySelector("#ios-base64-result");

    clear_servernames_btn.addEventListener('click', () => {
        serverNames.value = '';
    });

    clear_configs_btn.addEventListener('click', () => {
        configsInput.value = '';
    });

    base64Result.addEventListener('click', () => {
        copyToClipBoard(base64Result);
    });
    IOSbase64Result.addEventListener('click', () => {
        copyToClipBoard(IOSbase64Result);
    });
    simpleResult.addEventListener('click', () => {
        copyToClipBoard(simpleResult);
    });

    let generateBtn = document.querySelector("#generate-btn");
    generateBtn.addEventListener("click", e => {
        e.preventDefault();


        let { trojan, vmess, vless } = defineProtocol(configsInput.value)
        let configs = formValidation([serverNames, trojan, vmess, vless]);
        let [base64, simpleConfigs, iosBase64] = subscriptionText(configs)

        simpleResult.innerHTML = simpleConfigs;
        base64Result.innerHTML = base64;
        IOSbase64Result.innerHTML = iosBase64;

        console.log([base64, simpleConfigs, iosBase64])
        result.style.display = "block";
        return false;
    });
})

const findAddress = config => {
    let indexOfAtSign = config.indexOf("@");
    let indexOfColon = config.indexOf(":");
    let address = "";

    for (let i = indexOfAtSign + 1; i < indexOfColon; i++) {
        address += config[i];
    }

    return address;
}
const replaceAddress = (config, oldAddress, newAddress) => {
    return config = config.replace(oldAddress, newAddress);
}

const removeProtocol = (config, protocolName) => {
    let protocols = {
        "trojan": "trojan://",
        "vless": "vless://",
        "vmess": "vmess://",
    }

    return config = config.replace(protocols[protocolName], '');
}
const addProtocol = (config, protocolName) => {
    let protocols = {
        "trojan": "trojan://",
        "vless": "vless://",
        "vmess": "vmess://",
    }

    return config = `${protocols[protocolName]}${config}`;
}

const trojanGenerator = (config, newAddress) => {
    const protocol = 'trojan';
    config = removeProtocol(config, protocol);
    let oldAddress = findAddress(config);
    let configString = replaceAddress(config, oldAddress, newAddress);

    return addProtocol(configString, protocol);
}
const vlessGenerator = (config, newAddress) => {
    const protocol = 'vless';
    config = removeProtocol(config, protocol);
    let oldAddress = findAddress(config);
    let configString = replaceAddress(config, oldAddress, newAddress);

    return addProtocol(configString, protocol);
}
const vmessGenerator = (config, newAddress) => {
    const protocol = 'vmess';
    config = removeProtocol(config, protocol);

    let configObject = atob(config)
    let newConfig = { ...JSON.parse(configObject) };
    newConfig.add = newAddress;
    newConfig = JSON.stringify(newConfig);
    newConfig = btoa(newConfig);

    let configString = addProtocol(newConfig, protocol);
    return configString;
}

const multiProtocolGenerator = (protocol, config, list) => {
    let configs = [];
    switch (protocol) {
        case 'trojan':
            list.forEach(newAddress => {
                if (newAddress == undefined || newAddress == '' || newAddress == ' ') return;
                let newConfig = trojanGenerator(config, removeSpacing(newAddress));
                configs.push(newConfig);
            });
            break;
        case 'vless':
            list.forEach(newAddress => {
                if (newAddress == undefined || newAddress == '' || newAddress == ' ') return;
                let newConfig = vlessGenerator(config, removeSpacing(newAddress));
                configs.push(newConfig);
            });
            break;
        case 'vmess':
            list.forEach(newAddress => {
                if (newAddress == undefined || newAddress == '' || newAddress == ' ') return;
                let newConfig = vmessGenerator(config, removeSpacing(newAddress));
                configs.push(newConfig);
            });
            break;
    }
    return configs;
}

const formValidation = ([serverNames, trojanInput, vmessInput, vlessInput]) => {
    let configs = [];
    if (serverNames.value == '') {
        alert("domain or ip is required !!!");
        return;
    } else if (!(trojanInput.length || vmessInput.length || vlessInput.length)) {
        alert("you have to enter a config !!!");
        return;
    }

    let serverslist = serverNames.value.split('\n');

    if (trojanInput.length != 0) {
        trojanInput.forEach(config => {
            let generatedConfigs = multiProtocolGenerator('trojan', removeSpacing(config), serverslist);
            configs.push(...generatedConfigs);
        });
    }
    if (vmessInput.length != 0) {
        vmessInput.forEach(config => {
            let generatedConfigs = multiProtocolGenerator('vmess', removeSpacing(config), serverslist);
            configs.push(...generatedConfigs);
        });
    }
    if (vlessInput.length != 0) {
        vlessInput.forEach(config => {

            let generatedConfigs = multiProtocolGenerator('vless', removeSpacing(config), serverslist);
            configs.push(...generatedConfigs);
        });
    }

    return configs;
}

const subscriptionText = configArray => {
    if (configArray.length === 0) return;

    let text = "";
    let iosBase64 = "";
    configArray.forEach(config => {
        text += `${config}\n`;
        iosBase64 += `${btoa(config)}\n`;
    });
    return [btoa(text), text, iosBase64];
}
