// const testShapes = [
//     "m 50,50 l 100,0 l 0,100 l -100,0 z",
//     "m 300 300 a 50 50 90 1 1 100 0 a 50 50 90 1 1 -100 0 z",
//     "m 744 136 h -202 c -10 0 -18 8 -18 18 h 238 c 0 -10 -8 -18 -18 -18 z",
//     "m 240 200 v -20 a 20 20 90 1 1 40 40 l -40 -20 z",
//     "m 80 508 s 70 -54 60 -138 s 66 -98 150 -50 z",
//     "m 628 356 l 192 -224 l 96 -32 l -32 96 l -224 192 c 32 32 32 64 64 30 c 0 32 32 64 0 64 a 45.44 45.44 90 0 1 -32 32 a 160 160 90 0 0 -64 -96 q -16 -3.2 -16 16 t -48 41.6 t -25.6 -25.6 t 41.6 -48 t 16 -16 a 160 160 90 0 0 -96 -64 a 45.44 45.44 90 0 1 32 -32 c 0 -32 32 0 64 0 c -32 32 0 32 32 66 l 192 -224 l 0 64 l 64 0 l -57.6 -6.4 l -6.4 -57.6 z"
// ];


"use strict";

const { PathParser, NormalizedPath } = require(".");

/* eslint no-process-exit: 0 */
/* eslint global-require: 0 */

if ( require.main === module ) {
  let sliceN = 1;
  if ( process.argv.indexOf( module.filename ) > -1 || require( "path" ).basename( process.argv[ 1 ] ) === "path-parser" ) {
    sliceN = 2;
  }
  const args = process.argv.slice( sliceN, process.argv.length );

  if ( args.length === 0 ) {
    console.error( "You must pass SVG paths enclosed between quotes as parameters." );
    process.exit( 1 );
  }

  for ( let a = 0; a < args.length; a++ ) {
    console.log( new NormalizedPath( args[ a ] ).toString() );
  }
}