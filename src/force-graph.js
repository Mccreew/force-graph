import { select as d3Select, event as d3Event } from 'd3-selection';
import { zoom as d3Zoom, zoomTransform as d3ZoomTransform } from 'd3-zoom';
import { drag as d3Drag } from 'd3-drag';
import throttle from 'lodash.throttle';
import TWEEN from '@tweenjs/tween.js';
import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';
import ColorTracker from 'canvas-color-tracker';

import CanvasForceGraph from './canvas-force-graph';
import linkKapsule from './kapsule-link.js';
import { stat } from 'fs';
import { schemePaired } from 'd3-scale-chromatic';
import { hasAnotherLink, setLinkCurvature, setNodePropertyMsg, filterDuplicateLink } from './UtilFunc'

const HOVER_CANVAS_THROTTLE_DELAY = 800; // ms to throttle shadow canvas updates for perf improvement
const ZOOM2NODES_FACTOR = 4;

// Expose config from forceGraph
const bindFG = linkKapsule('forceGraph', CanvasForceGraph);
const bindBoth = linkKapsule(['forceGraph', 'shadowGraph'], CanvasForceGraph);
const linkedProps = Object.assign(
	...[
		'nodeColor',
		'nodeAutoColorBy',
		'nodeCanvasObject',
		'linkColor',
		'linkAutoColorBy',
		'linkAutoColorBy',
		'linkWidth',
		'linkCanvasObject',
		'linkDirectionalArrowLength',
		'linkDirectionalArrowColor',
		'linkDirectionalArrowRelPos',
		'linkDirectionalParticles',
		'linkDirectionalParticleSpeed',
		'linkDirectionalParticleWidth',
		'linkDirectionalParticleColor',
		'dagMode',
		'dagLevelDistance',
		'd3AlphaDecay',
		'd3VelocityDecay',
		'warmupTicks',
		'cooldownTicks',
		'cooldownTime',
		'onEngineTick',
		'translateAnimation',
		'rightNode',
		'onEngineStop',
		'originData',
		'canvasColorTracker',
	].map(p => ({ [p]: bindFG.linkProp(p) })),
	...[
		'nodeRelSize',
		'nodeId',
		'nodeVal',
		'linkSource',
		'linkTarget',
		'linkVisibility',
		'linkCurvature'
	].map(p => ({ [p]: bindBoth.linkProp(p) }))
);
const linkedMethods = Object.assign(...[
	'd3Force',
	'feedData',
	'refreshData'
].map(p => ({ [p]: bindFG.linkMethod(p) })));

function adjustCanvasSize(state) {
	if (state.canvas) {
		let curWidth = state.canvas.width;
		let curHeight = state.canvas.height;
		if (curWidth === 300 && curHeight === 150) { // Default canvas dimensions
			curWidth = curHeight = 0;
		}

		const pxScale = window.devicePixelRatio; // 2 on retina displays
		curWidth /= pxScale;
		curHeight /= pxScale;

		// Resize canvases
		[state.canvas, state.shadowCanvas].forEach(canvas => {
			// Element size
			canvas.style.width = `${state.width}px`;
			canvas.style.height = `${state.height}px`;

			// Memory size (scaled to avoid blurriness)
			canvas.width = state.width * pxScale;
			canvas.height = state.height * pxScale;

			// Normalize coordinate system to use css pixels (on init only)
			if (!curWidth && !curHeight) {
				canvas.getContext('2d').scale(pxScale, pxScale);
			}
		});

		// Relative center panning based on 0,0
		const k = d3ZoomTransform(state.canvas).k;
		state.zoom.translateBy(state.zoom.__baseElem,
			(state.width - curWidth) / 2 / k,
			(state.height - curHeight) / 2 / k
		);
	}
}

function resetTransform(ctx) {
	const pxRatio = window.devicePixelRatio;
	ctx.setTransform(pxRatio, 0, 0, pxRatio, 0, 0);
}

function clearCanvas(ctx, width, height) {
	ctx.save();
	resetTransform(ctx);  // reset transform
	ctx.clearRect(0, 0, width, height);
	ctx.restore();        //restore transforms
}


/**
 * 点击轮盘
 * @param {*} state
 * @param {*} d state.hoverObj.d
 * @param {*} od origin data
 * @param {*} clickedNode 点击的节点
 */
function onControlCircleClick(state, d, od, clickedNode) {
	/**
	 * 当一个轮盘点击的时候，发起请求，获得与点击节点相联系的节点。
	 * 在当前已有的节点中,也就是od.nodes,过滤掉有联系的下一层的节点，
	 * 重新绘制画布
	 */
	if (d.type === 'firstCon') {
		console.log('first clicked')
		clickedNode.expand = false

		axios.get('http://localhost:8080/child/' + clickedNode.id).then(req => {
			let childNodeIds = []
			// 拥有其他边的childNode
			let moreLinkNodeIds = []
			req.data.nodes.forEach(node => {
				if (hasAnotherLink(node.id, od.links, clickedNode.id)) {
					moreLinkNodeIds.push(node.id)
					return
				}
				childNodeIds.push(node.id)
			})

			// 删除单独的子节点
			let newNodes = od.nodes.filter(n => childNodeIds.indexOf(n.id) == -1)
			console.log('after filter nodes: ', newNodes)
			// 删除与子节点联系的边
			let newLinks = od.links.filter(l => childNodeIds.indexOf(l.source.id) == -1 && childNodeIds.indexOf(l.target.id) == -1)
			console.log('after filter links: ', newLinks)
			// 删除有其他联系的子节点的边
			// newLinks = newLinks.filter(l => moreLinkNodeIds.indexOf(l.target.id) == -1 || l.source.id != clickedNode.id)
			for (let i = 0; i < newLinks.length; i++) {
				if (moreLinkNodeIds.indexOf(newLinks[i].target.id) != -1 && newLinks[i].source.id == clickedNode.id) {
					delete newLinks[i]
				}
			}
			newLinks = newLinks.filter(l => l)

			od.nodes = newNodes
			od.links = newLinks
			state.forceGraph.graphData(od)
		})
	}
	if (d.type === 'secondCon') {
		console.log('second clicked')
		od.nodes = od.nodes.filter(n => n.id != clickedNode.id)
		od.links = od.links.filter(l => {
			if(l.source.id == clickedNode.id || l.target.id == clickedNode.id){
				return false
			}
			return true
		})
		state.forceGraph.graphData(od)
	}
	if (d.type === 'thirdCon') {
		console.log('third clicked')
		clickedNode.fx = null
		clickedNode.fy = null
	}
}

export default Kapsule({
	props: {
		clickedNode: { default: null, triggerUpdate: false },
		width: { default: window.innerWidth, onChange: (_, state) => adjustCanvasSize(state), triggerUpdate: false },
		height: { default: window.innerHeight, onChange: (_, state) => adjustCanvasSize(state), triggerUpdate: false },
		graphData: {
			default: { nodes: [], links: [] },
			onChange: ((d, state) => {

				if (d.nodes.length || d.links.length) {
					console.info('force-graph loading', d.nodes.length + ' nodes', d.links.length + ' links');
					
					setNodePropertyMsg(d.nodes, state.ctx)

					/*自动增加颜色*/
					d.nodes.forEach(n => {
						if (!n.color) {
							n.color = schemePaired[n.group % 12]
						}
						if (!n.hasOwnProperty('show')) {
							n.show = true
						}
					})
					d.links.forEach((l,index) => {
						if (!l.color) {
							l.color = schemePaired[l.group % 12]
						}
						if (!l.hasOwnProperty('show')) {
							l.show = true
						}
						l.index = index
					})
					if(state.invisiableColor){
						console.log('state.invisiableColor: ', state.invisiableColor)
						d.nodes.forEach(n => {
							if(state.invisiableColor.indexOf(n.color) != -1){
								n.show = false
							}
						})
					}

					state.onDataChange(d)
				}

				[{ type: 'Node', objs: d.nodes }, { type: 'Link', objs: d.links }].forEach(hexIndex);
				state.forceGraph.graphData(d);
				state.shadowGraph.graphData(d);

				function hexIndex({ type, objs }) {
					objs
						.filter(d => !d.hasOwnProperty('__indexColor') || d !== state.colorTracker.lookup(d.__indexColor))
						.forEach(d => {
							// store object lookup color
							d.__indexColor = state.colorTracker.register({ type, d });
						});
				}
			}),
			triggerUpdate: false
		},
		backgroundColor: {
			onChange(color, state) {
				state.canvas && color && (state.canvas.style.background = color)
			}, triggerUpdate: false
		},
		nodeLabel: { default: 'name', triggerUpdate: false },
		linkLabel: { default: 'name', triggerUpdate: false },
		linkHoverPrecision: { default: 4, triggerUpdate: false },
		enableNodeDrag: { default: true, triggerUpdate: false },
		enableZoomPanInteraction: { default: true, triggerUpdate: false },
		enablePointerInteraction: {
			default: true, onChange(_, state) {
				state.hoverObj = null;
			}, triggerUpdate: false
		},
		onNodeDrag: {
			default: () => {
			}, triggerUpdate: false
		},
		onNodeDragEnd: {
			default: () => {
			}, triggerUpdate: false
		},
		onNodeClick: {
			default: () => {
			}, triggerUpdate: false
		},
		onNodeRightClick: { triggerUpdate: false },
		onNodeHover: {
			default: () => {
			}, triggerUpdate: false
		},
		onLinkClick: {
			default: () => {
			}, triggerUpdate: false
		},
		onLinkRightClick: { triggerUpdate: false },
		onLinkHover: {
			default: () => {
			}, triggerUpdate: false
		},
		onControlCircleHover: {
			default: () => { }, triggerUpdate: false
		},
		onControlCircleClick: {
			default: () => { }, triggerUpdate: false
		},
		onDataChange: {
			default: () => { },
			triggerUpdate: false
		},
		invisiableColor: {
			default: null,
			triggerUpdate: false
		},
		// firstClick:{default:false, triggerUpdate: false},
		...linkedProps
	},

	aliases: { // Prop names supported for backwards compatibility
		stopAnimation: 'pauseAnimation'
	},

	methods: {
		centerAt: function (state, x, y, transitionDuration) {
			if (!state.canvas) return null; // no canvas yet

			// setter
			if (x !== undefined || y !== undefined) {
				const finalPos = Object.assign({},
					x !== undefined ? { x } : {},
					y !== undefined ? { y } : {}
				);
				if (!transitionDuration) { // no animation
					setCenter(finalPos);
				} else {
					new TWEEN.Tween(getCenter())
						.to(finalPos, transitionDuration)
						.easing(TWEEN.Easing.Quadratic.Out)
						.onUpdate(setCenter)
						.start();
				}
				return this;
			}

			// getter
			return getCenter();

			//

			function getCenter() {
				const t = d3ZoomTransform(state.canvas);
				return { x: (state.width / 2 - t.x) / t.k, y: (state.height / 2 - t.y) / t.k };
			}

			function setCenter({ x, y }) {
				state.zoom.translateTo(
					state.zoom.__baseElem,
					x === undefined ? getCenter().x : x,
					y === undefined ? getCenter().y : y
				);
			}
		},
		zoom: function (state, k, transitionDuration) {
			if (!state.canvas) return null; // no canvas yet

			// setter
			if (k !== undefined) {
				if (!transitionDuration) { // no animation
					setZoom(k);
				} else {
					new TWEEN.Tween({ k: getZoom() })
						.to({ k }, transitionDuration)
						.easing(TWEEN.Easing.Quadratic.Out)
						.onUpdate(({ k }) => setZoom(k))
						.start();
				}
				return this;
			}

			// getter
			return getZoom();

			//

			function getZoom() {
				return d3ZoomTransform(state.canvas).k;
			}

			function setZoom(k) {
				state.zoom.scaleTo(state.zoom.__baseElem, k);
			}
		},
		pauseAnimation: function (state) {
			if (state.animationFrameRequestId) {
				cancelAnimationFrame(state.animationFrameRequestId);
				state.animationFrameRequestId = null;
			}
			return this;
		},
		resumeAnimation: function (state) {
			if (!state.animationFrameRequestId) {
				this._animationCycle();
			}
			return this;
		},
		_destructor: function () {
			this.pauseAnimation();
			this.graphData({ nodes: [], links: [] });
		},
		...linkedMethods
	},

	stateInit: () => ({
		lastSetZoom: 1,
		forceGraph: new CanvasForceGraph(),
		shadowGraph: new CanvasForceGraph()
			.cooldownTicks(0)
			.nodeColor('__indexColor')
			.linkColor('__indexColor')
			.isShadow(true),
		colorTracker: new ColorTracker() // indexed objects for rgb lookup
	}),

	init: function (domNode, state) {
		// Wipe DOM
		domNode.innerHTML = '';

		/*同步canvas-force-graph的colorTracker*/
		state.forceGraph.canvasColorTracker(state.colorTracker)
		state.shadowGraph.canvasColorTracker(state.colorTracker)
		// console.log('state.forceGraph: ', state.forceGraph)
		// console.log('state.canvasColorTracker: ', state.canvasColorTracker)

		// Container anchor for canvas and tooltip
		const container = document.createElement('div');
		container.style.position = 'relative';
		container.style.padding = 0
		domNode.appendChild(container);

		state.canvas = document.createElement('canvas');
		if (state.backgroundColor) state.canvas.style.background = state.backgroundColor;
		container.appendChild(state.canvas);

		state.shadowCanvas = document.createElement('canvas');

		// Show shadow canvas
		//state.shadowCanvas.style.position = 'absolute';
		//state.shadowCanvas.style.top = '0';
		//state.shadowCanvas.style.left = '0';
		//container.appendChild(state.shadowCanvas);

		const ctx = state.canvas.getContext('2d');
		state.ctx = ctx
		const shadowCtx = state.shadowCanvas.getContext('2d');

		// Setup node drag interaction
		d3Select(state.canvas).call(
			d3Drag()
				.subject(() => {
					if (!state.enableNodeDrag) {
						return null;
					}
					const obj = state.hoverObj;
					return (obj && obj.type === 'Node') ? obj.d : null; // Only drag nodes
				})
				.on('start', () => {
					const obj = d3Event.subject;
					obj.__initialDragPos = { x: obj.x, y: obj.y, fx: obj.fx, fy: obj.fy };

					// keep engine running at low intensity throughout drag
					if (!d3Event.active) {
						// state.forceGraph.d3AlphaTarget(0.3); // keep engine running at low intensity throughout drag
						state.forceGraph.d3AlphaTarget(0.05);//让画面运行得更慢一点
						obj.fx = obj.x;
						obj.fy = obj.y; // Fix points
					}

					// drag cursor
					state.canvas.classList.add('grabbable');
				})
				.on('drag', () => {
					const obj = d3Event.subject;
					const initPos = obj.__initialDragPos;
					const dragPos = d3Event;

					const k = d3ZoomTransform(state.canvas).k;

					// Move fx/fy (and x/y) of nodes based on the scaled drag distance since the drag start
					['x', 'y'].forEach(c => obj[`f${c}`] = obj[c] = initPos[c] + (dragPos[c] - initPos[c]) / k);

					// prevent freeze while dragging
					state.forceGraph.resetCountdown();

					state.onNodeDrag(obj);
				})
				.on('end', () => {
					const obj = d3Event.subject;
					const initPos = obj.__initialDragPos;

					if (initPos.fx === undefined) {
						obj.fx = undefined;
					}
					if (initPos.fy === undefined) {
						obj.fy = undefined;
					}
					delete (obj.__initialDragPos);

					state.forceGraph
						.d3AlphaTarget(0)   // release engine low intensity
						.resetCountdown();  // let the engine readjust after releasing fixed nodes

					// drag cursor
					state.canvas.classList.remove('grabbable');

					state.onNodeDragEnd(obj);
				})
		);

		// Setup zoom / pan interaction
		state.zoom = d3Zoom();
		state.zoom(state.zoom.__baseElem = d3Select(state.canvas)); // Attach controlling elem for easy access

		state.zoom.__baseElem.on('dblclick.zoom', null); // Disable double-click to zoom

		state.zoom
			.filter(() => state.enableZoomPanInteraction ? !d3Event.button : false) // disable zoom interaction
			.scaleExtent([0.1, 10])
			// .translateExtent([null, [window.innerWidth + 20, window.innerHeight + 20]])
			.on('zoom', function (d, i, self) {
				const t = d3ZoomTransform(this); // Same as d3.event.transform
				[ctx, shadowCtx].forEach(c => {
					resetTransform(c);
					c.translate(t.x, t.y);
					c.scale(t.k, t.k);
				});
			});

		adjustCanvasSize(state);

		state.forceGraph.onFinishLoading(() => {
			// re-zoom, if still in default position (not user modified)
			if (d3ZoomTransform(state.canvas).k === state.lastSetZoom) {
				state.zoom.scaleTo(state.zoom.__baseElem,
					// state.lastSetZoom = ZOOM2NODES_FACTOR / Math.cbrt(state.graphData.nodes.length)
					2
				);
			}
		});

		// Setup tooltip
		const toolTipElem = document.createElement('div');
		toolTipElem.classList.add('graph-tooltip');
		container.appendChild(toolTipElem);

		// Capture mouse coords on move
		const mousePos = { x: -1e12, y: -1e12 };
		state.canvas.addEventListener('mousemove', ev => {
			// update the mouse pos
			const offset = getOffset(container);
			mousePos.x = ev.pageX - offset.left;
			mousePos.y = ev.pageY - offset.top;

			// Move tooltip
			toolTipElem.style.top = `${mousePos.y}px`;
			toolTipElem.style.left = `${mousePos.x}px`;

			//

			function getOffset(el) {
				const rect = el.getBoundingClientRect(),
					scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
					scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
			}

		}, false);

		// Handle click events on nodes/links
		container.addEventListener('click', ev => {
			if (state.hoverObj) {
				// if(state.hoverObj.type === 'ControlCircle'){
				// console.log('tool: ', state.hoverObj.d)
				// }
				if (state.hoverObj.type === 'Node') {

					// 点击固定节点
					state.hoverObj.d.fx = state.hoverObj.d.x
					state.hoverObj.d.fy = state.hoverObj.d.y

					state.hoverObj.d.clicked = state.hoverObj.d.clicked ? false : true;
					if (state.hoverObj.d.clicked) {
						if (state.clickedNode) {
							state.clickedNode.clicked = false
						}
						state.clickedNode = state.hoverObj.d;
					} else if (state.clickedNode) {
						state.clickedNode = null
					}
					/*每次点击都视为改变了node*/
					state.forceGraph.changeClickNode(true)
					state.shadowGraph.changeClickNode(true)
				}

				if (state.hoverObj.type === 'ControlCircle') {
					onControlCircleClick(state, state.hoverObj.d, state.graphData, state.clickedNode)
				}

				state[`on${state.hoverObj.type}Click`](state.hoverObj.d, state.graphData, state.clickedNode);
			} else {
				if (state.clickedNode) {
					state.clickedNode.clicked = false
				}
				state.clickedNode = null
			}
		}, false);

		// Handle right-click events
		container.addEventListener('contextmenu', ev => {
			if (!state.onNodeRightClick && !state.onLinkRightClick) return true; // default contextmenu behavior

			ev.preventDefault();
			if (state.hoverObj) {
				const fn = state[`on${state.hoverObj.type}RightClick`];
				fn && fn(state.hoverObj.d);
			}
			return false;
		}, false);

		state.forceGraph(ctx);
		state.shadowGraph(shadowCtx);

		//

		const refreshShadowCanvas = throttle(() => {
			// wipe canvas
			clearCanvas(shadowCtx, state.width, state.height);

			// Adjust link hover area
			state.shadowGraph.linkWidth(l => accessorFn(state.linkWidth)(l) + state.linkHoverPrecision);

			// redraw
			const t = d3ZoomTransform(state.canvas);
			state.shadowGraph.globalScale(t.k).tickFrame();
		}, HOVER_CANVAS_THROTTLE_DELAY);

		// Kick-off renderer
		(this._animationCycle = function animate() { // IIFE
			if (state.enablePointerInteraction) {
				// Update tooltip and trigger onHover events

				// Lookup object per pixel color
				const pxScale = window.devicePixelRatio;
				const px = shadowCtx.getImageData(mousePos.x * pxScale, mousePos.y * pxScale, 1, 1);
				const obj = px ? state.colorTracker.lookup(px.data) : null;

				if (obj !== state.hoverObj) {
					const prevObj = state.hoverObj;
					const prevObjType = prevObj ? prevObj.type : null;
					const objType = obj ? obj.type : null;

					// hover移出轮盘
					if (prevObjType !== objType && prevObjType === 'ControlCircle') {
						state.forceGraph.hoverType(null)
					}

					if (prevObjType && prevObjType !== objType) {
						// Hover out
						state[`on${prevObjType}Hover`](null, prevObj.d);
					}
					if (objType) {
						// hover轮盘
						if (objType === 'ControlCircle') {
							state.forceGraph.hoverType(obj.d.type)
						}

						// Hover in
						state[`on${objType}Hover`](obj.d, prevObjType === objType ? prevObj.d : null);
					}


					const tooltipContent = obj ? accessorFn(state[`${obj.type.toLowerCase()}Label`])(obj.d) || '' : '';
					toolTipElem.style.visibility = tooltipContent ? 'visible' : 'hidden';
					toolTipElem.innerHTML = tooltipContent;

					state.hoverObj = obj;
				}

				refreshShadowCanvas();
			}

			// Wipe canvas
			clearCanvas(ctx, state.width, state.height);

			// Frame cycle
			const t = d3ZoomTransform(state.canvas);
			state.forceGraph.globalScale(t.k).tickFrame();

			TWEEN.update(); // update canvas animation tweens

			state.animationFrameRequestId = requestAnimationFrame(animate);
		})();

		/*注册控制轮盘的__indexColor*/
		let toolTypes = ['firstCon', 'secondCon', 'thirdCon']
		let controlTools = []
		for (let i = 0; i < 3; i++) {
			let obj = {
				type: toolTypes[i]
			}
			obj.__indexColor = state.colorTracker.register({ type: 'ControlCircle', d: obj });
			controlTools.push(obj)
		}
		state.shadowGraph.controlTools(controlTools)

	},

	update: function updateFn(state) {
	}
});
