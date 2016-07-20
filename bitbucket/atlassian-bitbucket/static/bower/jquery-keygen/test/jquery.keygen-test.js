(function () {
   var generator;

   module("KeyGenerator", {
      setup: function () {
         generator = KeyGenerator();
      }
   });
    
   test("always outputs in uppercase", function() {
      $.each(["thekey", "TheKey", "ThEkEy", "tHEKEy"], function (index, key) {
         equal(generator.generateKey(key, {desiredKeyLength: 6}), "THEKEY");
      });
   });
    
   test("insignificant whitespace is stripped", function () {
      equal(generator.generateKey("   \r\n    key  "), "KEY", "should ignore spaces and newlines");
   });
    
   test("multiple words are converted in to an acronym", function () {
      equal(generator.generateKey("uno dos tres"), "UDT");
   });
    
   test("english grammatical words are not used to generate keys", function () {      
      equal(generator.generateKey("the key", {desiredKeyLength: 4}), "KEY", "'the' is an ignored grammatical word");
      equal(generator.generateKey("the key of G Major", {desiredKeyLength: 4}), "KGM", "'the' and 'of' are ignored grammatical words");
      equal(generator.generateKey("As A User I Would Like To Be Able To", {desiredKeyLength: 8}), "UIWLTBAT", "'as' and 'a' are ignored grammatical words");
   });
    
   test("ignored words are only ignored when key length must be reduced", function () {
      equal(generator.generateKey("Game of Thrones", {desiredKeyLength: 0}), "GOT", "keys of infinite length shouldn't care too much");
      equal(generator.generateKey("Game of Thrones", {desiredKeyLength: 9}), "GAMETHRONES", "ignored words are stripped if their original string is longer than the desired length");
      equal(generator.generateKey("Game of Thrones", {desiredKeyLength: 9, maxKeyLength: 9}), "GT", "ignored words are stripped if their original string is longer than the desired length");
   });
    
   test("syllables are removed when key longer than desired length", function () {
      equal(generator.generateKey("thekey", {desiredKeyLength: 4}), "THEK", "should strip at the second 'e'");
      equal(generator.generateKey("macchiato", {desiredKeyLength: 6}), "MAC", "should strip at the second 'c'");
      equal(generator.generateKey("affogato", {desiredKeyLength: 4}), "AF", "should strip at the second 'f'");
   });

   test("max key length is respected", function () {
      equal(generator.generateKey("thekey", {maxKeyLength: 4}), "THEK", "should strip at the second 'e'");
      equal(generator.generateKey("macchiato", {maxKeyLength: 6}), "MAC", "should strip at the second 'c'");
      equal(generator.generateKey("affogato", {maxKeyLength: 7}), "AF", "should strip at the second 'f'");
   });

   test("punctuation is ignored", function () {
      equal(generator.generateKey("I'm little tea-pot, short, stout!", {desiredKeyLength: 5}), "ILTSS");
   });
    
   test("numbers are ignored", function () {
      equal(generator.generateKey("l337sp34k"), "LSPK", "nobody should have to read numbers like they were letters");
   });
    
   test("certain diacritic characters are converted to english alphabet equivalents", function () {
      var resume = String.fromCharCode(114, 233, 115, 117, 109, 233);
      var pate = String.fromCharCode(112, 226, 116, 233);
      equal(generator.generateKey(resume, {desiredKeyLength: 6}), "RESUME", "accented e should become a regular e");
      equal(generator.generateKey(pate, {desiredKeyLength: 4}), "PATE", "accented a should become a regular a");
    
      var grave = String.fromCharCode(224, 232, 236, 242, 249);
      var acute = String.fromCharCode(225, 233, 237, 243, 250);
      var circumflex = String.fromCharCode(226, 234, 238, 244, 251);
      $.each([grave, acute, circumflex], function (index, accented) {
         equal(generator.generateKey(accented), "AEIOU");
      });
   });
    
   test("extended characters from utf-8 are ignored", function() {
      var nihonjin = String.fromCharCode(26085, 26412, 20154);
      equal(generator.generateKey(nihonjin), "", "japanese characters are ignored");
    
      var anna_karenina = String.fromCharCode(1040, 1085, 1085, 1072, 32, 1050, 1072, 1088, 1077, 1085, 1080, 1085, 1072);
      equal(generator.generateKey(anna_karenina), "", "cryllic is ignored");
   });
})();
