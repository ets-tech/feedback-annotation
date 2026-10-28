// Agentation plus a "Send All n Feedbacks" tab that shares every page's notes at once.
// Load it as a module: <script type="module" src=".../feedback-annotation.js?app=MyApp&hide=telegram"></script>
// esm.sh pins one React for all three imports; two copies (Agentation's and react-dom's) would crash its hooks.
import React from 'https://esm.sh/react@19.3.0';
import { createRoot } from 'https://esm.sh/react-dom@19.3.0/client?deps=react@19.3.0';
// Exact version: this file relies on Agentation's storage keys and data-feedback-toolbar, which a minor release could change.
import { Agentation } from 'https://esm.sh/agentation@3.1.2?deps=react@19.3.0,react-dom@19.3.0';

// Settings come from this script's own URL.
const params = new URL( import.meta.url ).searchParams;
const APP = params.get( 'app' ) || 'TestApp';
const HIDDEN = ( params.get( 'hide' ) || '' ).toLowerCase().split( ',' ).map( ( s ) => s.trim() );
const HIDE_BUTTON = 'true' === ( params.get( 'hide_all_feedback_button' ) || '' ).toLowerCase();
// Posting lives in the drawer, so hide_all_feedback_button turns it off too.
const POST_URL = HIDE_BUTTON ? '' : params.get( 'post_url' ) || '';
const TOKEN = params.get( 'post_token' ) || '';
const POST_LABEL = params.get( 'post_label' ) || 'Post to server';

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
// Agentation keys its list by pathname alone, so ?date=… and #/route variants of one page share a list. Remember
// the full path + query + fragment each annotation was made on (by id, via Agentation's callbacks) and group the report by that.
const URLS = 'ets-tech-feedback-annotations-urls';
const DEVICE = 'ets-tech-feedback-annotations-device';
const DELETED = 'ets-tech-feedback-annotations-deleted'; // id → when, for notes deleted since the last post.
const POSTED = 'ets-tech-feedback-annotations-posted'; // id → comment as last posted, to spot new and edited notes.
const SESSION = 'ets-tech-feedback-annotations-session'; // One id for every note in this browser, e.g. a Jira ticket.
const session = () => localStorage.getItem( SESSION ) || '';
const load = ( key ) => { try { return JSON.parse( localStorage.getItem( key ) ) || {}; } catch ( e ) { return {}; } };
const update = ( key, change ) => { try { const o = load( key ); change( o ); localStorage.setItem( key, JSON.stringify( o ) ); } catch ( e ) {} };
const urls = () => load( URLS );
const remember = ( change ) => update( URLS, change );
const deleted = ( list ) => POST_URL && update( DELETED, ( d ) => list.forEach( ( a ) => { d[ a.id ] = new Date().toISOString(); } ) );
const callbacks = {
	onAnnotationAdd: ( a ) => {
		remember( ( seen ) => { seen[ a.id ] = location.pathname + location.search + location.hash; } );
		if ( ! session() ) askSession?.( true );
	},
	onAnnotationDelete: ( a ) => { remember( ( seen ) => { delete seen[ a.id ]; } ); deleted( [ a ] ); },
	onAnnotationsClear: ( list ) => { remember( ( seen ) => list.forEach( ( a ) => delete seen[ a.id ] ) ); deleted( list ); },
};
const host = document.createElement( 'div' );
document.body.append( host );
createRoot( host ).render( React.createElement( Agentation, { appName: APP, ...callbacks } ) );
const askSession = HIDE_BUTTON ? null : sendButton();

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
	css.textContent = '#ets-tech-feedback-annotations-all,.ets-tech-feedback-annotations-dialog{--bg:#1c1c1c;--fg:rgba(255,255,255,.85);--hover:rgba(255,255,255,.08);--line:rgba(255,255,255,.1);--shadow:0 4px 16px rgba(0,0,0,.4)}#ets-tech-feedback-annotations-all.light,.ets-tech-feedback-annotations-dialog.light{--bg:#fff;--fg:rgba(0,0,0,.85);--hover:rgba(0,0,0,.05);--line:rgba(0,0,0,.08);--shadow:0 4px 16px rgba(0,0,0,.12)}'
		+ '#ets-tech-feedback-annotations-all{position:fixed;right:0;top:50%;z-index:2147483647;display:flex;align-items:center;filter:drop-shadow(var(--shadow));font:13px system-ui,sans-serif;transform:translate(100%,-50%);visibility:hidden;transition:transform .35s cubic-bezier(.32,.72,0,1),visibility 0s .35s}#ets-tech-feedback-annotations-all.shown{transform:translate(220px,-50%);visibility:visible;transition:transform .35s cubic-bezier(.32,.72,0,1)}#ets-tech-feedback-annotations-all.shown.open{transform:translate(0,-50%)}'
		+ '#ets-tech-feedback-annotations-all button{display:flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--fg);font:inherit;cursor:pointer;white-space:nowrap}#ets-tech-feedback-annotations-all button:focus-visible,.ets-tech-feedback-annotations-dialog button:focus-visible{outline:2px solid #3c82f7;outline-offset:-2px}#ets-tech-feedback-annotations-all svg,.ets-tech-feedback-annotations-dialog svg{width:14px;height:14px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
		+ '#ets-tech-feedback-annotations-all .tab{align-self:stretch;writing-mode:vertical-rl;transform:rotate(180deg);justify-content:center;gap:5px;padding:9px 7px;background:var(--bg);font-size:12px;font-weight:700;border-radius:0 6px 6px 0}#ets-tech-feedback-annotations-all .tab svg{transform:rotate(180deg);transition:transform .35s cubic-bezier(.32,.72,0,1)}#ets-tech-feedback-annotations-all.open .tab svg{transform:none}'
		+ '#ets-tech-feedback-annotations-all .menu{flex:none;width:220px;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;padding:6px;background:var(--bg);border-radius:0;border-left:1px solid var(--line);opacity:0;transform:scale(.96);transform-origin:left center;visibility:hidden;transition:opacity .2s ease,transform .35s cubic-bezier(.32,.72,0,1),visibility 0s .35s}#ets-tech-feedback-annotations-all.open .menu{opacity:1;transform:none;visibility:visible;transition:opacity .2s ease,transform .35s cubic-bezier(.32,.72,0,1)}'
		+ '#ets-tech-feedback-annotations-all .menu button{padding:8px 10px;border-radius:.375rem;text-align:left;transition:background-color .15s ease}#ets-tech-feedback-annotations-all .menu button:hover{background:var(--hover)}#ets-tech-feedback-annotations-all .menu .danger{color:#ef4444}#ets-tech-feedback-annotations-all .menu .danger:hover{background:rgba(239,68,68,.12)}#ets-tech-feedback-annotations-all hr{border:0;border-top:1px solid var(--line);margin:4px 2px}#ets-tech-feedback-annotations-all .head{padding:6px 10px 6px;color:var(--fg);opacity:.55;font-size:12px;font-weight:600}#ets-tech-feedback-annotations-all .session span{overflow:hidden;text-overflow:ellipsis}'
		// Host CSS like dialog{display:block} would otherwise show the closed dialog.
		+ '.ets-tech-feedback-annotations-dialog{max-width:340px;padding:0;border:0;border-radius:1rem;background:var(--bg);color:var(--fg);box-shadow:0 10px 40px rgba(0,0,0,.4),0 0 0 1px var(--line);font:14px/1.45 system-ui,sans-serif}.ets-tech-feedback-annotations-dialog:not([open]){display:none!important}.ets-tech-feedback-annotations-dialog[open]{animation:ets-tech-feedback-annotations-in .15s ease-out}@keyframes ets-tech-feedback-annotations-in{from{opacity:0;transform:scale(.85)}}.ets-tech-feedback-annotations-dialog::backdrop{background:rgba(0,0,0,.5)}.ets-tech-feedback-annotations-dialog form{padding:20px}.ets-tech-feedback-annotations-dialog h2{margin:0 0 8px;font-size:16px}.ets-tech-feedback-annotations-dialog p{margin:0 0 18px}.ets-tech-feedback-annotations-dialog .actions{display:flex;justify-content:flex-end;gap:8px}'
		+ '.ets-tech-feedback-annotations-dialog button{display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:var(--fg);font:inherit;cursor:pointer}.ets-tech-feedback-annotations-dialog button:hover{background:var(--hover)}.ets-tech-feedback-annotations-dialog button.danger{border-color:#ef4444;background:#ef4444;color:#fff}.ets-tech-feedback-annotations-dialog button.primary{border-color:#3c82f7;background:#3c82f7;color:#fff}.ets-tech-feedback-annotations-dialog input{display:block;width:100%;box-sizing:border-box;margin:0 0 8px;padding:8px 10px;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:var(--fg);font:inherit}.ets-tech-feedback-annotations-dialog .hint{font-size:13px;opacity:.7}.ets-tech-feedback-annotations-dialog button[hidden]{display:none}#ets-tech-feedback-annotations-all button:disabled,.ets-tech-feedback-annotations-dialog button:disabled{opacity:.6;cursor:default}'
		+ '@media (prefers-reduced-motion:reduce){#ets-tech-feedback-annotations-all,#ets-tech-feedback-annotations-all .menu,#ets-tech-feedback-annotations-all .menu button{transition:none!important}.ets-tech-feedback-annotations-dialog[open]{animation:none}}';
	document.head.append( css );
	// Lucide-style stroke icons, drawn with the text colour.
	const ICONS = {
		WhatsApp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
		Email: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
		Telegram: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
		copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
		upload: '<path d="M12 13v8"/><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="m8 17 4-4 4 4"/>',
		download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
		pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
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
	// A setting rather than a share action, so it sits above the rule. Long ids are cut with … and shown whole in the tooltip.
	const ses = document.createElement( 'button' );
	ses.className = 'session';
	ses.onclick = () => askSession( false );
	menu.append( ses, document.createElement( 'hr' ) );
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
		sdlg.classList.toggle( 'light', light );
		const text = 1 === n ? 'Send 1 Feedback' : 'Send All ' + n + ' Feedbacks';
		main.children[ 1 ].textContent = text;
		if ( ses.title !== session() ) setLabel( ses, 'pencil', Object.assign( document.createElement( 'span' ), { textContent: 'Session: ' + session() } ) );
		ses.title = session();
		// Looked up once the tab first shows, so report() can stay synchronous: share links must open inside the click.
		if ( n && undefined === ip ) {
			ip = null;
			fetch( 'https://api.ipify.org', { credentials: 'omit', signal: AbortSignal.timeout( 5000 ) } )
				.then( ( r ) => r.ok ? r.text() : '' ).then( ( t ) => { ip = /^[\d.:a-f]+$/i.test( t = t.trim() ) ? t : null; } ).catch( () => {} );
		}
	};
	let ip; // undefined: not asked yet; null: failed or offline.
	// App and Environment once, then one "Page Feedback" section per path + query + fragment with its notes in Agentation's forensic layout.
	const report = () => [
		'I added ' + count() + ( 1 === count() ? ' feedback' : ' feedbacks' ) + ' on ' + location.host + '. Fix each one, then verify it in the running app:',
		'',
		'**App:** ' + APP,
		'',
		'**Environment:**',
		'- Session ID: ' + session(),
		'- Public IP: ' + ( ip || 'Unavailable' ),
		'- Viewport: ' + innerWidth + '×' + innerHeight,
		'- Origin: ' + location.origin,
		'- User Agent: ' + navigator.userAgent,
		'- Timestamp: ' + new Date().toISOString(),
		'- Device Pixel Ratio: ' + devicePixelRatio,
		'',
		'---',
		...lists().flatMap( ( [ path, list ] ) => [ '', '## Page Feedback: ' + path, '', ...list.map( ( a, i ) => forensic( a, i ) + '\n' ) ] ),
	].join( '\n' ).trim();
	// One self-contained object per note, so the server can upsert each by hash; deleted notes go as stubs with deleted: true.
	// Agentation's own fields go under agentation, so they never clash with ours (it has an optional url too).
	// clearing marks every note deleted. Returns the failure label, or nothing once the server answered 2xx.
	const post = async ( clearing ) => {
		const now = new Date().toISOString(), live = lists().flatMap( ( [ url, list ] ) => list.map( ( a ) => ( { url, a } ) ) );
		try {
			const device = deviceId(), hash = ( id ) => sha256( APP + location.origin + device + id );
			const gone = { ...load( DELETED ), ...( clearing && Object.fromEntries( live.map( ( { a } ) => [ a.id, now ] ) ) ) };
			const body = await Promise.all( [
				...( clearing ? [] : live ).map( async ( { url, a } ) => {
					const u = new URL( url, location.origin );
					return {
						hash: await hash( a.id ), deleted: false, app: APP, deviceId: device, sessionId: session(), publicIp: ip || null, origin: location.origin,
						url: u.href, path: u.pathname, query: u.search, fragment: u.hash,
						userAgent: navigator.userAgent, viewport: innerWidth + '×' + innerHeight, devicePixelRatio, sentAt: now, agentation: a,
					};
				} ),
				...Object.entries( gone ).map( async ( [ id, deletedAt ] ) => ( { hash: await hash( id ), deleted: true, app: APP, deviceId: device, sessionId: session(), deletedAt, agentation: { id } } ) ),
			] );
			const res = await fetch( POST_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...( TOKEN && { Authorization: 'Bearer ' + TOKEN } ) },
				body: JSON.stringify( body ),
				credentials: 'omit',
				signal: AbortSignal.timeout( 15000 ),
			} );
			if ( ! res.ok ) {
				console.error( 'Feedback post failed:', res.status, await res.text() );
				return 'Failed (' + res.status + ')';
			}
			localStorage.removeItem( DELETED );
			localStorage.setItem( POSTED, JSON.stringify( Object.fromEntries( live.map( ( { a } ) => [ a.id, a.comment ] ) ) ) );
		} catch ( e ) {
			console.error( 'Feedback post failed:', e );
			return 'Failed';
		}
	};
	const unposted = () => { const sent = load( POSTED ); return lists().reduce( ( n, [ , l ] ) => n + l.filter( ( a ) => sent[ a.id ] !== a.comment ).length, 0 ); };
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
	if ( POST_URL ) {
		const up = document.createElement( 'button' );
		setLabel( up, 'upload', POST_LABEL );
		up.onclick = async () => {
			up.disabled = true;
			setLabel( up, 'upload', 'Sending…' );
			const failed = await post();
			setLabel( up, failed ? 'upload' : 'check', failed || 'Sent' );
			setTimeout( () => { up.disabled = false; setLabel( up, 'upload', POST_LABEL ); if ( ! failed ) setOpen( false ); }, failed ? 2000 : 1000 );
		};
		menu.append( up );
	}
	const cp = document.createElement( 'button' );
	setLabel( cp, 'copy', 'Copy' );
	cp.onclick = async () => {
		await copyText( report() );
		setLabel( cp, 'check', 'Copied' );
		setTimeout( () => { setLabel( cp, 'copy', 'Copy' ); setOpen( false ); }, 1000 );
	};
	menu.append( cp );
	if ( ! HIDDEN.includes( 'download' ) ) {
		const dl = document.createElement( 'button' );
		setLabel( dl, 'download', 'Download' );
		dl.onclick = () => {
			setOpen( false );
			const a = Object.assign( document.createElement( 'a' ), {
				href: URL.createObjectURL( new Blob( [ report() ], { type: 'text/markdown' } ) ),
				download: ( session().replace( /[^\w.-]+/g, '_' ).replace( /^[_.]+|[_.]+$/g, '' ) || 'feedback' ) + '.md',
			} );
			a.click();
			setTimeout( () => URL.revokeObjectURL( a.href ) );
		};
		menu.append( dl );
	}
	// Red and set apart below a rule, so it is not hit on the way to Copy.
	const clear = document.createElement( 'button' );
	clear.className = 'danger';
	setLabel( clear, 'trash', 'Clear all' );
	// Reloads after: Agentation holds this page's notes in memory and would save them back on its next change.
	// With post_url, it first posts every note as deleted and clears nothing unless the server answers 2xx.
	// A modal rather than confirm(): focus starts on Cancel, so Enter, Escape and a click outside all cancel; only a click on the red button clears.
	const dlg = document.createElement( 'dialog' );
	dlg.dataset.feedbackToolbar = '';
	dlg.id = 'ets-tech-feedback-annotations-clear';
	dlg.className = 'ets-tech-feedback-annotations-dialog';
	dlg.innerHTML = '<form method="dialog"><h2>Clear all feedback?</h2><p></p><div class="actions"><button value="cancel" autofocus>Cancel</button><button value="post" hidden></button><button value="clear" class="danger"></button></div></form>';
	const LABELS = { post: [ 'upload', POST_LABEL, 'Sending…' ], clear: [ 'trash', 'Clear all', 'Clearing…' ] };
	const [ , dlgPost, dlgClear ] = dlg.querySelectorAll( 'button' );
	dlg.onclick = ( e ) => { if ( e.target === dlg ) dlg.close(); }; // The backdrop.
	const wipe = () => {
		Object.keys( localStorage ).filter( ( k ) => k.startsWith( PREFIX ) || [ URLS, DELETED, POSTED, SESSION ].includes( k ) ).forEach( ( k ) => localStorage.removeItem( k ) );
		location.reload();
	};
	dlg.onclose = () => { if ( 'clear' === dlg.returnValue ) wipe(); };
	dlg.querySelector( 'form' ).onsubmit = async ( e ) => {
		const b = e.submitter;
		if ( ! POST_URL || ! LABELS[ b?.value ] ) return;
		e.preventDefault();
		const [ icon, text, busy ] = LABELS[ b.value ];
		b.disabled = true;
		setLabel( b, icon, busy );
		const failed = await post( 'clear' === b.value );
		if ( ! failed ) return 'clear' === b.value ? wipe() : dlg.close();
		setLabel( b, icon, failed );
		setTimeout( () => { b.disabled = false; setLabel( b, icon, text ); }, 2000 );
	};
	document.body.append( dlg );
	// Asked on the first note, and from the drawer's Session row. On the first note every way out saves, blank meaning
	// a generated id, so every note has one; from the drawer, Escape or a click outside keeps the current id.
	const sdlg = document.createElement( 'dialog' );
	sdlg.dataset.feedbackToolbar = '';
	sdlg.id = 'ets-tech-feedback-annotations-session';
	sdlg.className = 'ets-tech-feedback-annotations-dialog';
	sdlg.innerHTML = '<form method="dialog"><h2></h2><input maxlength="100" placeholder="PROJ-123 or #42" aria-label="Session ID" autofocus><p class="hint"></p><div class="actions"><button value="save" class="primary">Save</button></div></form>';
	const sInput = sdlg.querySelector( 'input' );
	let first;
	sdlg.onclick = ( e ) => { if ( e.target === sdlg ) sdlg.close(); };
	sdlg.onclose = () => {
		if ( first || 'save' === sdlg.returnValue ) localStorage.setItem( SESSION, sInput.value.trim() || APP + '-' + uuid().slice( 0, 8 ) );
		label();
	};
	document.body.append( sdlg );
	// Notes made before sessions existed get an id quietly.
	if ( count() && ! session() ) localStorage.setItem( SESSION, APP + '-' + uuid().slice( 0, 8 ) );
	clear.onclick = () => {
		setOpen( false );
		const n = POST_URL ? unposted() : 0;
		dlg.querySelector( 'p' ).textContent = 'This removes all ' + count() + ' feedback on every page. It cannot be undone.'
			+ ( n ? ' ' + n + ' feedback ' + ( 1 === n ? 'hasn\'t' : 'haven\'t' ) + ' been posted to the server yet.' : '' );
		dlgPost.hidden = ! n;
		Object.entries( LABELS ).forEach( ( [ v, [ icon, text ] ] ) => { const b = 'post' === v ? dlgPost : dlgClear; b.disabled = false; setLabel( b, icon, text ); } );
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
	return ( isFirst ) => {
		if ( sdlg.open ) return;
		setOpen( false );
		first = isFirst;
		sdlg.querySelector( 'h2' ).textContent = first ? 'Session ID' : 'Update session ID';
		sdlg.querySelector( 'p' ).textContent = 'Groups this feedback. Use a Jira ticket or GitHub issue, or leave blank to auto-generate ' + APP + '-xxxxxxxx.'
			+ ( first ? ' You can update it any time from Session in the Send feedback tab on the right.' : '' );
		sInput.value = first ? '' : session();
		sdlg.returnValue = '';
		sdlg.showModal();
	};
}

// A random id per browser, so two testers' notes made in the same millisecond still hash apart.
function deviceId() {
	let id = localStorage.getItem( DEVICE );
	if ( ! id ) localStorage.setItem( DEVICE, id = uuid() );
	return id;
}

// randomUUID is https-only; getRandomValues works on http too.
function uuid() {
	return crypto.randomUUID?.() || [ ...crypto.getRandomValues( new Uint8Array( 16 ) ) ].map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

// Hex SHA-256. crypto.subtle exists only on https and localhost, so http dev sites use the plain-JS version below.
async function sha256( text ) {
	const bytes = new TextEncoder().encode( text );
	if ( ! crypto.subtle ) return sha256js( bytes );
	return [ ...new Uint8Array( await crypto.subtle.digest( 'SHA-256', bytes ) ) ].map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

function sha256js( bytes ) {
	const r = ( x, n ) => ( x >>> n ) | ( x << ( 32 - n ) ), K = [];
	let H = [];
	// Fractional parts of the square and cube roots of the first primes, per the spec.
	for ( let n = 2; K.length < 64; n++ ) {
		let prime = true;
		for ( let d = 2; d * d <= n; d++ ) if ( n % d === 0 ) prime = false;
		if ( ! prime ) continue;
		if ( H.length < 8 ) H.push( ( n ** ( 1 / 2 ) % 1 ) * 2 ** 32 | 0 );
		K.push( ( n ** ( 1 / 3 ) % 1 ) * 2 ** 32 | 0 );
	}
	const size = ( ( bytes.length + 72 ) >> 6 ) << 6, m = new Uint8Array( size ), dv = new DataView( m.buffer ), w = [];
	m.set( bytes );
	m[ bytes.length ] = 0x80;
	dv.setUint32( size - 4, bytes.length * 8 ); // Inputs here are tiny, so the length's high word stays 0.
	for ( let i = 0; i < size; i += 64 ) {
		let [ a, b, c, d, e, f, g, h ] = H;
		for ( let j = 0; j < 64; j++ ) {
			if ( j < 16 ) w[ j ] = dv.getUint32( i + j * 4 );
			else {
				const x = w[ j - 15 ], y = w[ j - 2 ];
				w[ j ] = ( ( r( x, 7 ) ^ r( x, 18 ) ^ ( x >>> 3 ) ) + w[ j - 16 ] + ( r( y, 17 ) ^ r( y, 19 ) ^ ( y >>> 10 ) ) + w[ j - 7 ] ) | 0;
			}
			const t1 = ( h + ( r( e, 6 ) ^ r( e, 11 ) ^ r( e, 25 ) ) + ( ( e & f ) ^ ( ~e & g ) ) + K[ j ] + w[ j ] ) | 0;
			const t2 = ( ( r( a, 2 ) ^ r( a, 13 ) ^ r( a, 22 ) ) + ( ( a & b ) ^ ( a & c ) ^ ( b & c ) ) ) | 0;
			[ h, g, f, e, d, c, b, a ] = [ g, f, e, ( d + t1 ) | 0, c, b, a, ( t1 + t2 ) | 0 ];
		}
		H = H.map( ( v, k ) => ( v + [ a, b, c, d, e, f, g, h ][ k ] ) | 0 );
	}
	return H.map( ( v ) => ( v >>> 0 ).toString( 16 ).padStart( 8, '0' ) ).join( '' );
}
