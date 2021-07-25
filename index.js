const { arcToCubicBeziers } = require("./arcToCubicBeziers");

const round = ( value, decimals ) => Math.round( value * ( decimals ** 100 ) ) / ( decimals ** 100 );

class PathParser {

    static validCommand = /^[\t\n\f\r\s]*([achlmqstvz])[\t\n\f\r\s]*/i;
    static validFlag = /^[01]/;
    static validCoordinate = /^[+-]?((\d*\.\d+)|(\d+\.)|(\d+))(e[+-]?\d+)?/i;
    static validComma = /^(([\t\n\f\r\s]+,?[\t\n\f\r\s]*)|(,[\t\n\f\r\s]*))/;

    static pathGrammar = {
        m: [ this.validCoordinate, this.validCoordinate ],
        l: [ this.validCoordinate, this.validCoordinate ],
        h: [ this.validCoordinate ],
        v: [ this.validCoordinate ],
        z: [],
        c: [ this.validCoordinate, this.validCoordinate, this.validCoordinate, this.validCoordinate, this.validCoordinate, this.validCoordinate ],
        s: [ this.validCoordinate, this.validCoordinate, this.validCoordinate, this.validCoordinate ],
        q: [ this.validCoordinate, this.validCoordinate, this.validCoordinate, this.validCoordinate ],
        t: [ this.validCoordinate, this.validCoordinate ],
        a: [ this.validCoordinate, this.validCoordinate, this.validCoordinate, this.validFlag, this.validFlag, this.validCoordinate, this.validCoordinate ],
    };

    static pointGrammar = {
        z: () => [],
        Z: () => [],
        m: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 1 ], previousPoint[ 1 ] + command[ 2 ] ],
        M: command => command.slice( 1 ),
        h: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 1 ], previousPoint[ 1 ] ],
        H: ( command, previousPoint ) => [ command[ 1 ], previousPoint[ 1 ] ],
        v: ( command, previousPoint ) => [ previousPoint[ 0 ], previousPoint[ 1 ] + command[ 1 ] ],
        V: ( command, previousPoint ) => [ previousPoint[ 0 ], command[ 1 ] ],
        l: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 1 ], previousPoint[ 1 ] + command[ 2 ] ],
        L: command => command.slice( 1 ),
        a: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 6 ], previousPoint[ 1 ] + command[ 7 ] ],
        A: command => command.slice( 6 ),
        c: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 5 ], previousPoint[ 1 ] + command[ 6 ] ],
        C: command => command.slice( 5 ),
        t: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 1 ], previousPoint[ 1 ] + command[ 2 ] ],
        T: command => command.slice( 1 ),
        q: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 3 ], previousPoint[ 1 ] + command[ 4 ] ],
        Q: command => command.slice( 3 ),
        s: ( command, previousPoint ) => [ previousPoint[ 0 ] + command[ 3 ], previousPoint[ 1 ] + command[ 4 ] ],
        S: command => command.slice( 3 )
    };

    static parseComponents( type, command, cursor ) {
        const expectedCommands = this.pathGrammar[ type.toLowerCase() ];
        const components = [];
        while ( cursor <= command.length ) {
            const component = [ type ];
            for ( const regex of expectedCommands ) {
                const match = command.slice( cursor ).match( regex );
                if ( match !== null ) {
                    component.push( round( match[ 0 ], 1 ) );
                    cursor += match[ 0 ].length;
                    const nextSlice = command.slice( cursor ).match( this.validComma );
                    if ( nextSlice !== null ) cursor += nextSlice[ 0 ].length;
                } else if ( component.length === 1 ) {
                    return [ cursor, components ];
                } else {
                    throw new Error( `Invalid path: first error at char ${ cursor }` );
                }
            }
            components.push( component );
            if ( expectedCommands.length === 0 ) return [ cursor, components ];
            if ( type === 'm' ) type = 'l';
            if ( type === 'M' ) type = 'L';
        }
        throw new Error( `Invalid path: first error at char ${ cursor }` );
    }

    static parseRaw( path ) {
        let cursor = 0, parsedParameters = [];
        while ( cursor < path.length ) {
            const match = path.slice( cursor ).match( this.validCommand );
            if ( match !== null ) {
                const command = match[ 1 ];
                cursor += match[ 0 ].length;
                const componentList = PathParser.parseComponents( command, path, cursor );
                cursor = componentList[ 0 ];
                parsedParameters = [ ...parsedParameters, ...componentList[ 1 ] ];
            } else {
                throw new Error(  `Invalid path: first error at char ${ cursor }`  );
            }
        }
        return parsedParameters;
    }

}

class NormalizedPath {

    constructor( descriptor ) {
        this.parse( descriptor );
    }

    parse( descriptor ) {
        let quadX, quadY, bezierX, bezierY, previousCommand = "", previousPoint = [ 0, 0 ];
        const isRelative = command => command[ 0 ] === command[ 0 ].toLowerCase();
        const updatePrevious = command => {
            previousCommand = command[ 0 ];
            if ( command[ 0 ].toLowerCase () === "h" ) previousPoint[ 0 ] = isRelative( command ) ? previousPoint[ 0 ] + command[ 1 ] : command[ 1 ];
            else if ( command[ 0 ].toLowerCase () === "v" ) previousPoint[ 1 ] = isRelative( command ) ? previousPoint[ 1 ] + command[ 1 ] : command[ 1 ];
            else {
                previousPoint = isRelative( command ) ? [ previousPoint[ 0 ] + command[ command.length - 2 ], previousPoint[ 1 ] + command[ command.length - 1 ] ] : command.slice( command.length - 2 );
            }
        };
        this.parsedCommands = PathParser.parseRaw( descriptor ).reduce( ( result, command, index ) => {
            let normalizedCommand;
            switch ( command[ 0 ] ) {
                case "M":
                    if ( !index ) normalizedCommand = command;
                    else normalizedCommand = [ "C", ...previousPoint, ...command.slice( 1 ), ...command.slice( 1 ) ];
                    break;
                case "H":
                    normalizedCommand = [ "C", ...previousPoint, command[ 1 ], previousPoint[ 1 ], command[ 1 ], previousPoint[ 1 ] ];
                    break;
                case "V":
                    normalizedCommand = [ "C", ...previousPoint, 0, command[ 1 ], 0, command[ 1 ] ];
                    break;
                case "L":
                    normalizedCommand = [ "C", ...previousPoint, ...command.slice( 1 ), ...command.slice( 1 ) ];
                    break;
                case "S": 
                    let [ cx, cy ] = previousPoint;
                    if ( [ "c", "s" ].includes( previousCommand.toLowerCase() ) ) {
                        cx += cx - bezierX;
                        cy += cy - bezierY;
                    }
                    normalizedCommand = [ "C", cx, cy, command[ 1 ], command[ 2 ], command[ 3 ], command[ 4 ] ];
                    break;
                case "Q":
                    quadX = command[ 1 ];
                    quadY = command[ 2 ];
                    normalizedCommand = [ "C",
                        previousPoint[ 0 ] / 3 + ( 2 / 3 ) * command[ 1 ],
                        previousPoint[ 1 ] / 3 + ( 2 / 3 ) * command[ 2 ],
                        command[ 3 ] / 3 + ( 2 / 3 ) * command[ 1 ],
                        command[ 4 ] / 3 + ( 2 / 3 ) * command[ 2 ],
                        command[ 3 ],
                        command[ 4 ]
                    ];
                    break;
                case "T":
                    if ( [ "q", "t" ].includes( command[ 0 ].toLowerCase() ) ) {
                        quadX = previousPoint[ 0 ] * 2 - quadX;
                        quadY = previousPoint[ 1 ] * 2 - quadY;
                    } else {
                        quadX = previousPoint[ 0 ];
                        quadY = previousPoint[ 1 ];
                    }
                    normalizedCommand = [
                        previousPoint[ 0 ] / 3 + ( 2 / 3 ) * quadX,
                        previousPoint[ 1 ] / 3 + ( 2 / 3 ) * quadY,
                        command[ 1 ] / 3 + ( 2 / 3 ) * quadX,
                        command[ 2 ] / 3 + ( 2 / 3 ) * quadY,
                        command[ 1 ],
                        command[ 2 ]
                    ];
                    break;
                case "A":
                    normalizedCommand = [ "C", ...arcToCubicBeziers( previousPoint, command.slice( 1 ) ) ];
                    break;
                case "C":
                    normalizedCommand = command;
                    break;
                case "Z":
                    normalizedCommand = [ "Z" ];
                    break;
                default: break;
            }
            [ bezierX, bezierY ] = command.length > 4 ? [ command[ command.length - 4 ], command[ command.length - 3 ] ] : [ previousPoint[ 0 ], previousPoint[ 1 ] ];
            updatePrevious( command );
            return [ ...result, normalizedCommand ];
        }, [] );
    }

    toString() { return this.parsedCommands.flat().join( " " ); }

}

module.exports = { PathParser, NormalizedPath };