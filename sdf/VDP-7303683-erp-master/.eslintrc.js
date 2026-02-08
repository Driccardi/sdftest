module.exports = {
    "parserOptions" : {
        "ecmaVersion": 2017,
        "sourceType" : "module"
    },
    "plugins": [ "security", "optimize-regex", "sonarjs","prettier",
     "@nscs/suitescript-rules"],
    "env": {
        "es6" : true,
        "browser": false,
        "node": false,
      //  "suitescript-rules/suitescript": true
    },
    "extends": [
        "plugin:optimize-regex/recommended",
        "plugin:security/recommended",
        
        "mcafee",
        //"eslint:recommended",
        //"plugin:sonarjs/recommended",
    ],
    "rules" : {
        "@nscs/suitescript-rules/add-error-handler-on-user-events": 1,
        "@nscs/suitescript-rules/avoid-contains-operator": 1,
        "@nscs/suitescript-rules/avoid-hard-coding-data-center-url": 1,
        "@nscs/suitescript-rules/suitescript-record-rules": 1,
        "@nscs/suitescript-rules/suitescript-slash-modules": 1,
        "@nscs/suitescript-rules/suitescript-fileextension-in-define-statement": 1,
        "@nscs/suitescript-rules/suitescript-return-statement-search": 1,
        "@nscs/suitescript-rules/suitescript-warn-deprecated-usages": 1,
        //"@nscs/suitescript/suitescript-userevent-rules": 1,
        "@nscs/suitescript-rules/suitescript-version-check": 1,
         "@nscs/suitescript-rules/suitescript-username": "warn",
        "@nscs/suitescript-rules/suitescript-create-search": "warn",
         "@nscs/suitescript-rules/suitescript-password": "error",
         "@nscs/suitescript-rules/suitescript-externalUrl": "warn",
          "@nscs/suitescript-rules/suitescript-internalUrl": "warn",
         "@nscs/suitescript-rules/call-nlapiauth": "warn",
         "@nscs/suitescript-rules/call-nlapicreaterenderer": "warn",
         "@nscs/suitescript-rules/call-nlapicrypto": "warn",
         "@nscs/suitescript-rules/call-nlapidecrypt": "warn",
         "@nscs/suitescript-rules/call-nlapiemail": "warn",
         "@nscs/suitescript-rules/call-nlapiencrypt": "warn",
         "@nscs/suitescript-rules/call-nlapigensso": "warn",
         "@nscs/suitescript-rules/call-nlapihttp": "warn",
         "@nscs/suitescript-rules/call-nlapioutboundsso": "warn",
         "@nscs/suitescript-rules/call-nlapiredirect": "warn",
         "@nscs/suitescript-rules/call-nlapirender": "warn",
         "@nscs/suitescript-rules/call-nlapirequesturl": "warn",
         "@nscs/suitescript-rules/call-nlapirequesturlwithcredentials": "warn",
         "@nscs/suitescript-rules/call-nlapisendemail": "warn",
         "@nscs/suitescript-rules/call-nlapiserverresponse": "warn",
         "@nscs/suitescript-rules/call-nlapixmltopdf": "warn",
         "@nscs/suitescript-rules/call-nlobjrequest-method": "warn",
         "@nscs/suitescript-rules/call-nlobjresponse-method": "warn",
         "@nscs/suitescript-rules/function-service": "warn",
         "optimize-regex/optimize-regex": "warn",


         //sonar
         "sonarjs/prefer-immediate-return": "warn",
         "sonarjs/cognitive-complexity": "warn",
         "sonarjs/no-collapsible-if": "warn",
         "sonarjs/no-all-duplicated-branches": "warn",
         "sonarjs/no-element-overwrite": "warn",
         "sonarjs/no-extra-arguments": "warn",
         "sonarjs/no-identical-conditions": "warn",
         "sonarjs/no-identical-expressions": "warn",
         "sonarjs/no-one-iteration-loop": "warn",
         "sonarjs/no-use-of-empty-return-value": "warn",
         "sonarjs/no-duplicate-string": "warn",
         "sonarjs/no-identical-functions": "warn",
         "sonarjs/no-inverted-boolean-check": "warn",
         "sonarjs/no-redundant-boolean": "warn",
         "sonarjs/no-element-overwrite": "warn",
         "sonarjs/no-useless-catch": "warn",
         "sonarjs/prefer-single-boolean-return": "warn",

         //prettier
         //"prettier/prettier": "warn",

         //mcafee
        "no-undef": 0,
        "quotes": 0,
       "no-trailing-spaces": 1,
       "no-mixed-spaces-and-tabs": 1,
       "consistent-return": 1,
       "no-empty": 0
       
    }
};