/**
 * Converts a pdf file at a given path to a tiff file with
 * the GraphicsMagick command "convert"
 */
var temp = require('temp');
var path = require('path');
var exec = require('child_process').exec
var spawn = require('child_process').spawn;
var fs = require('fs');
var pdf_convert_quality = 400; // default to density 400 for the convert command
var pdf_convert_papersize = 'letter'; // default to density 400 for the convert command

/* Paper sizes in inches [width, height] */
const papersize_inches = {
  '4a0': [66.220, 93.622],
  '2a0': [46.811, 66.220],
  'a0': [33.110, 46.811],
  'a1': [23.386, 33.110],
  'a2': [16.535, 23.386],
  'a3': [11.693, 16.535],
  'a4': [8.268, 11.693],
  'a5': [5.827, 8.268],
  'a6': [4.134, 5.827],
  'a7': [2.913, 4.134],
  'a8': [2.047, 2.913],
  'a9': [1.457, 2.047],
  'a10': [1.024, 1.457],
  'letter': [8.5, 11],
  'legal': [8.5, 14],
  'tabloid': [11, 17],
  'ledger': [17, 11],
}

/**
 * @param input_path the path to a pdf file on disk. Since GhostScript requires random file access, we need a path
 *   to an actual file rather than accepting a stream
 * @param {String} options is an optional object that should contain quality and papaersize properties (i.e. {quality: 400, papersize: 'a4'})
 * @return {String} output_path the path to the converted tif file
 * @return callback(<maybe error>, output_path)
 */
exports = module.exports = function convert(input_path, options, callback) {
  // options is an optional parameter
  if (!callback || typeof callback != "function") {
    callback = options;   // callback must be the second parameter
    options = undefined;  // no option passed
  }

  fs.exists(input_path, function (exists) {
    if (!exists) { return callback('error, no file exists at the path you specified: ' + input_path); }
    // get a temp output path

    var output_path = temp.path({prefix: 'tif_output', suffix:'.tif'});
    // var output_path = path.join(__dirname,'test/test_data/single_page_raw.tif');
    var params = [

      // '-depth 8',
      // '-background white',
      // '-flatten +matte',
      // '-density '+pdf_convert_quality,
      input_path,
      output_path
    ];
    if (options && options.quality) {
      if (typeof(options.quality) !== 'number') {
        return callback('error, pdf quality option must be a number, you passed a ' + typeof(options.quality));
      }
      pdf_convert_quality = options.quality;
    }
    if (options && options.papersize) {
      if (typeof(options.papersize) !== 'string') {
        return callback('error, pdf papersize option must be a string, you passed a ' + typeof(options.papersize));
      }
      pdf_convert_papersize = options.papersize.toLowerCase();
      if (!papersize_inches[pdf_convert_papersize]) {
        return callback('error, pdf papersize option must be one of the following: ' + Object.keys(papersize_inches).join(', '));
      }
    }

    var aspect = Math.round(pdf_convert_quality * papersize_inches[pdf_convert_papersize][0]) + 'x' + Math.round(pdf_convert_quality * papersize_inches[pdf_convert_papersize][1]);

    var cmd = 'gs -sDEVICE=tiffgray -r"' + pdf_convert_quality + '" -g"' + aspect + '" -sCompression=lzw -o "' + output_path + '" "' + input_path + '"';
    // var cmd = 'convert -depth 8 -background white -flatten +matte -density '+pdf_convert_quality+' "'+ input_path +'"  "' + output_path+'"';
    var child = exec(cmd, function (err, stderr, stdout) {
      if (err) {
        return callback(err);
      }
      return callback(null, output_path);
    });
  });
}
