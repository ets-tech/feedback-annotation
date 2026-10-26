// Agentation plus a "Send All n Feedbacks" tab that shares every page's notes at once.
// Load it as a module: <script type="module" src=".../feedback-annotation.js?app=MyApp&hide=telegram"></script>
// esm.sh pins one React for all three imports; two copies (Agentation's and react-dom's) would crash its hooks.
import React from 'https://esm.sh/react@19.3.0';
import { createRoot } from 'https://esm.sh/react-dom@19.3.0/client?deps=react@19.3.0';
import { Agentation } from 'https://esm.sh/agentation@3?deps=react@19.3.0,react-dom@19.3.0';

// Settings come from this script's own URL.
const params = new URL( import.meta.url ).searchParams;
const APP = params.get( 'app' ) || 'TestApp';
const HIDDEN = ( params.get( 'hide' ) || '' ).toLowerCase().split( ',' ).map( ( s ) => s.trim() );
const HIDE_BUTTON = 'true' === ( params.get( 'hide_all_feedback_button' ) || '' ).toLowerCase();

// Defaults, written once per browser so later changes in the toolbar settings stick.
try {
	if ( ! localStorage.getItem( 'ets-tech-feedback-annotations-defaults' ) ) {
		const saved = JSON.parse( localStorage.getItem( 'feedback-toolbar-settings' ) || '{}' );
		localStorage.setItem( 'feedback-toolbar-settings', JSON.stringify( { ...saved, outputDetail: 'forensic' } ) );
		localStorage.setItem( 'ets-tech-feedback-annotations-defaults', '1' );
	}
} catch ( e ) {}
// Agentation keeps one list per path and copies only the current one; the tab copies every path's list,
// in Agentation's own "forensic" layout (its formatter is not exported, so it is mirrored here).
const PREFIX = 'feedback-annotations-'; // Agentation's key, not ours: renaming it would lose the notes.
// Agentation keys its list by pathname alone, so ?date=… variants of one page share a list. Remember
// the full path + query each annotation was made on (by id, via Agentation's callbacks) and group the report by that.
const URLS = 'ets-tech-feedback-annotations-urls';
const urls = () => { try { return JSON.parse( localStorage.getItem( URLS ) ) || {}; } catch ( e ) { return {}; } };
const remember = ( change ) => { try { const seen = urls(); change( seen ); localStorage.setItem( URLS, JSON.stringify( seen ) ); } catch ( e ) {} };
const callbacks = {
	onAnnotationAdd: ( a ) => remember( ( seen ) => { seen[ a.id ] = location.pathname + location.search; } ),
	onAnnotationDelete: ( a ) => remember( ( seen ) => { delete seen[ a.id ]; } ),
	onAnnotationsClear: ( list ) => remember( ( seen ) => list.forEach( ( a ) => delete seen[ a.id ] ) ),
};
const host = document.createElement( 'div' );
document.body.append( host );
createRoot( host ).render( React.createElement( Agentation, { appName: APP, ...callbacks } ) );
if ( ! HIDE_BUTTON ) sendButton();

function sendButton() {
	const lists = () => {
		const seen = urls(), groups = new Map();
		for ( let i = 0; i < localStorage.length; i++ ) {
			const k = localStorage.key( i );
			if ( ! k.startsWith( PREFIX ) ) continue;
			try {
				( JSON.parse( localStorage.getItem( k ) ) || [] ).forEach( ( a ) => {
					const key = seen[ a.id ] || k.slice( PREFIX.length );
					groups.set( key, [ ...( groups.get( key ) || [] ), a ] );
				} );
			} catch ( e ) {}
		}
		return [ ...groups ];
	};
	const forensic = ( a, i ) => [
		'### ' + ( i + 1 ) + '. ' + a.element,
		a.fullPath && '**Full DOM Path:** ' + a.fullPath,
		a.cssClasses && '**CSS Classes:** ' + a.cssClasses,
		a.boundingBox && '**Position:** x:' + Math.round( a.boundingBox.x ) + ', y:' + Math.round( a.boundingBox.y ) + ' (' + Math.round( a.boundingBox.width ) + '×' + Math.round( a.boundingBox.height ) + 'px)',
		'**Annotation at:** ' + a.x.toFixed( 1 ) + '% from left, ' + Math.round( a.y ) + 'px from top',
		a.selectedText && '**Selected text:** "' + a.selectedText + '"',
		a.nearbyText && ! a.selectedText && '**Context:** ' + a.nearbyText.slice( 0, 100 ),
		a.computedStyles && '**Computed Styles:** ' + a.computedStyles,
		a.accessibility && '**Accessibility:** ' + a.accessibility,
		a.nearbyElements && '**Nearby Elements:** ' + a.nearbyElements,
		a.sourceFile && '**Source:** ' + a.sourceFile,
		a.reactComponents && '**React:** ' + a.reactComponents,
		'**Feedback:** ' + a.comment,
	].filter( Boolean ).join( '\n' );

	const all = document.createElement( 'div' );
	all.dataset.feedbackToolbar = ''; // Agentation ignores clicks on its own UI.
	all.id = 'ets-tech-feedback-annotations-all';
	const css = document.createElement( 'style' );
	// A vertical tab on the right edge, mid-height, clear of Agentation's toolbar in the bottom corner.
	// The tab rides on the left of a 220px drawer; closed, the drawer sits off-screen. Colours, radii and curves are Agentation's, light when its own theme toggle says so.
	// The tab itself is shaped like Inspera's "Self Help" tab: bold, reading upward. rotate(180deg) flips its corners and arrow too, so the CSS rounds the right corners and turns the arrow back.
	css.textContent = '#ets-tech-feedback-annotations-all,#ets-tech-feedback-annotations-clear{--bg:#1c1c1c;--fg:rgba(255,255,255,.85);--hover:rgba(255,255,255,.08);--line:rgba(255,255,255,.1);--shadow:0 4px 16px rgba(0,0,0,.4)}#ets-tech-feedback-annotations-all.light,#ets-tech-feedback-annotations-clear.light{--bg:#fff;--fg:rgba(0,0,0,.85);--hover:rgba(0,0,0,.05);--line:rgba(0,0,0,.08);--shadow:0 4px 16px rgba(0,0,0,.12)}'
		+ '#ets-tech-feedback-annotations-all{position:fixed;right:0;top:50%;z-index:2147483647;display:flex;align-items:center;filter:drop-shadow(var(--shadow));font:13px system-ui,sans-serif;transform:translate(100%,-50%);visibility:hidden;transition:transform .35s cubic-bezier(.32,.72,0,1),visibility 0s .35s}#ets-tech-feedback-annotations-all.shown{transform:translate(220px,-50%);visibility:visible;transition:transform .35s cubic-bezier(.32,.72,0,1)}#ets-tech-feedback-annotations-all.shown.open{transform:translate(0,-50%)}'
		+ '#ets-tech-feedback-annotations-all button{display:flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--fg);font:inherit;cursor:pointer;white-space:nowrap}#ets-tech-feedback-annotations-all button:focus-visible,#ets-tech-feedback-annotations-clear button:focus-visible{outline:2px solid #3c82f7;outline-offset:-2px}#ets-tech-feedback-annotations-all svg,#ets-tech-feedback-annotations-clear svg{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
		+ '#ets-tech-feedback-annotations-all .tab{align-self:stretch;writing-mode:vertical-rl;transform:rotate(180deg);justify-content:center;gap:5px;padding:9px 7px;background:var(--bg);font-size:12px;font-weight:700;border-radius:0 6px 6px 0}#ets-tech-feedback-annotations-all .tab svg{transform:rotate(180deg);transition:transform .35s cubic-bezier(.32,.72,0,1)}#ets-tech-feedback-annotations-all.open .tab svg{transform:none}'
		+ '#ets-tech-feedback-annotations-all .menu{flex:none;width:220px;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;padding:6px;background:var(--bg);border-radius:0;border-left:1px solid var(--line);opacity:0;transform:scale(.96);transform-origin:left center;visibility:hidden;transition:opacity .2s ease,transform .35s cubic-bezier(.32,.72,0,1),visibility 0s .35s}#ets-tech-feedback-annotations-all.open .menu{opacity:1;transform:none;visibility:visible;transition:opacity .2s ease,transform .35s cubic-bezier(.32,.72,0,1)}'
		+ '#ets-tech-feedback-annotations-all .menu button{padding:8px 10px;border-radius:.375rem;text-align:left;transition:background-color .15s ease}#ets-tech-feedback-annotations-all .menu button:hover{background:var(--hover)}#ets-tech-feedback-annotations-all .menu .danger{color:#ef4444}#ets-tech-feedback-annotations-all .menu .danger:hover{background:rgba(239,68,68,.12)}#ets-tech-feedback-annotations-all hr{border:0;border-top:1px solid var(--line);margin:4px 2px}#ets-tech-feedback-annotations-all .head{padding:6px 10px 6px;color:var(--fg);opacity:.55;font-size:12px;font-weight:600}'
		+ '#ets-tech-feedback-annotations-clear{max-width:340px;padding:0;border:0;border-radius:1rem;background:var(--bg);color:var(--fg);box-shadow:0 10px 40px rgba(0,0,0,.4),0 0 0 1px var(--line);font:14px/1.45 system-ui,sans-serif}#ets-tech-feedback-annotations-clear[open]{animation:ets-tech-feedback-annotations-in .15s ease-out}@keyframes ets-tech-feedback-annotations-in{from{opacity:0;transform:scale(.85)}}#ets-tech-feedback-annotations-clear::backdrop{background:rgba(0,0,0,.5)}#ets-tech-feedback-annotations-clear form{padding:20px}#ets-tech-feedback-annotations-clear h2{margin:0 0 8px;font-size:16px}#ets-tech-feedback-annotations-clear p{margin:0 0 18px}#ets-tech-feedback-annotations-clear .actions{display:flex;justify-content:flex-end;gap:8px}'
		+ '#ets-tech-feedback-annotations-clear button{display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:var(--fg);font:inherit;cursor:pointer}#ets-tech-feedback-annotations-clear button:hover{background:var(--hover)}#ets-tech-feedback-annotations-clear button.danger{border-color:#ef4444;background:#ef4444;color:#fff}'
		+ '@media (prefers-reduced-motion:reduce){#ets-tech-feedback-annotations-all,#ets-tech-feedback-annotations-all .menu,#ets-tech-feedback-annotations-all .menu button{transition:none!important}#ets-tech-feedback-annotations-clear[open]{animation:none}}';
	document.head.append( css );
	// Lucide-style stroke icons, drawn with the text colour.
	const ICONS = {
		WhatsApp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
		Email: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
		Telegram: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
		copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
	};
	const setLabel = ( b, icon, text ) => { b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[ icon ] + '</svg>'; b.append( text ); };
	const main = document.createElement( 'button' );
	main.className = 'tab';
	// Points left (open me) when closed and turns to point right (close me) when open.
	const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
	main.innerHTML = arrow + '<span></span>' + arrow;
	const menu = document.createElement( 'div' );
	menu.className = 'menu';
	// The drawer is as tall as its buttons; the tab is at least as long as its label and stretches to match a taller drawer.
	menu.innerHTML = '<div class="head">Share feedback</div>';
	all.append( main, menu );
	const setOpen = ( open ) => { all.classList.toggle( 'open', open ); main.setAttribute( 'aria-expanded', open ); };

	const count = () => lists().reduce( ( n, [ , l ] ) => n + l.length, 0 );
	const label = () => {
		const n = count();
		all.classList.toggle( 'shown', n > 0 );
		if ( ! n ) setOpen( false );
		const light = 'light' === localStorage.getItem( 'feedback-toolbar-theme' );
		all.classList.toggle( 'light', light );
		dlg.classList.toggle( 'light', light );
		const text = 1 === n ? 'Send 1 Feedback' : 'Send All ' + n + ' Feedbacks';
		main.children[ 1 ].textContent = text;
	};
	// App and Environment once, then one "Page Feedback" section per path + query with its notes in Agentation's forensic layout.
	const report = () => [
		'**App:** ' + APP,
		'',
		'**Environment:**',
		'- Viewport: ' + innerWidth + '×' + innerHeight,
		'- Origin: ' + location.origin,
		'- User Agent: ' + navigator.userAgent,
		'- Timestamp: ' + new Date().toISOString(),
		'- Device Pixel Ratio: ' + devicePixelRatio,
		'',
		'---',
		...lists().flatMap( ( [ path, list ] ) => [ '', '## Page Feedback: ' + path, '', ...list.map( ( a, i ) => forensic( a, i ) + '\n' ) ] ),
	].join( '\n' ).trim();
	const copyText = async ( text ) => {
		try { await navigator.clipboard.writeText( text ); } catch ( e ) { // https only; the dev site may be http.
			const t = Object.assign( document.createElement( 'textarea' ), { value: text } );
			document.body.append( t ); t.select(); document.execCommand( 'copy' ); t.remove();
		}
	};
	// shortcut: the whole report goes in the link, so a very long one may be cut by the app; use Copy then.
	const channels = {
		WhatsApp: ( t ) => 'https://wa.me/?text=' + encodeURIComponent( t ),
		Email: ( t ) => 'mailto:?subject=' + encodeURIComponent( APP + ' feedback' ) + '&body=' + encodeURIComponent( t ),
		Telegram: ( t ) => 'https://t.me/share/url?url=' + encodeURIComponent( location.origin ) + '&text=' + encodeURIComponent( t ),
	};
	Object.entries( channels ).filter( ( [ name ] ) => ! HIDDEN.includes( name.toLowerCase() ) ).forEach( ( [ name, href ] ) => {
		const b = document.createElement( 'button' );
		setLabel( b, name, name );
		b.onclick = () => { setOpen( false ); window.open( href( report() ), '_blank', 'noopener' ); };
		menu.append( b );
	} );
	const cp = document.createElement( 'button' );
	setLabel( cp, 'copy', 'Copy' );
	cp.onclick = async () => {
		await copyText( report() );
		setLabel( cp, 'check', 'Copied' );
		setTimeout( () => { setLabel( cp, 'copy', 'Copy' ); setOpen( false ); }, 1000 );
	};
	menu.append( cp );
	// Red and set apart below a rule, so it is not hit on the way to Copy.
	const clear = document.createElement( 'button' );
	clear.className = 'danger';
	setLabel( clear, 'trash', 'Clear all' );
	// Reloads after: Agentation holds this page's notes in memory and would save them back on its next change.
	// A modal rather than confirm(): focus starts on Cancel, so Enter, Escape and a click outside all cancel; only a click on the red button clears.
	const dlg = document.createElement( 'dialog' );
	dlg.dataset.feedbackToolbar = '';
	dlg.id = 'ets-tech-feedback-annotations-clear';
	dlg.innerHTML = '<form method="dialog"><h2>Clear all feedback?</h2><p></p><div class="actions"><button value="cancel" autofocus>Cancel</button><button value="clear" class="danger"></button></div></form>';
	setLabel( dlg.querySelector( '.danger' ), 'trash', 'Clear all' );
	dlg.onclick = ( e ) => { if ( e.target === dlg ) dlg.close(); }; // The backdrop.
	dlg.onclose = () => {
		if ( 'clear' !== dlg.returnValue ) return;
		Object.keys( localStorage ).filter( ( k ) => k.startsWith( PREFIX ) || k === URLS ).forEach( ( k ) => localStorage.removeItem( k ) );
		location.reload();
	};
	document.body.append( dlg );
	clear.onclick = () => {
		setOpen( false );
		dlg.querySelector( 'p' ).textContent = 'This removes all ' + count() + ' feedback on every page. It cannot be undone.';
		dlg.returnValue = '';
		dlg.showModal();
	};
	menu.append( document.createElement( 'hr' ), clear );
	main.onclick = () => setOpen( ! all.classList.contains( 'open' ) );
	// Mouse only: out of the Tab order, and never focused by a click, so Enter or Space can't toggle it.
	main.tabIndex = -1;
	main.onmousedown = ( e ) => e.preventDefault();
	// Capture phase, so Agentation stopping a click on its own UI still closes the drawer; the click itself goes through.
	document.addEventListener( 'click', ( e ) => { if ( ! all.contains( e.target ) ) setOpen( false ); }, true );
	document.addEventListener( 'keydown', ( e ) => {
		if ( 'Escape' === e.key ) setOpen( false );
	} );

	setOpen( false );
	label();
	setInterval( label, 1000 ); // Same-tab localStorage writes fire no event.
	document.body.append( all );
}
