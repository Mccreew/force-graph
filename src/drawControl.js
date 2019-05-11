const pi = Math.PI
let spaceAngle = pi / 100 // 轮盘间隔角度大小

let contrCle = {}
// contrCle.radius = 100
contrCle.startAngle = pi * 3 / 2 + spaceAngle
contrCle.endAngle = pi * 3 / 2 + pi * 2 / 3
contrCle.space = 0.3

let controlType = {
	'firstCon': 0,
	'secondCon': 1,
	'thirdCon': 2
}

// 绘制icon
const childNodeIcon = new Image()
const unlockIcon = new Image()
const deleteIcon = new Image()
childNodeIcon.src = './icon/childNode.svg'
deleteIcon.src = './icon/delete.svg'
unlockIcon.src = './icon/unlock.svg'

const icons = [childNodeIcon, deleteIcon, unlockIcon]


// TODO tween.js提升绘制轮盘效果
export default function (ctx, centerCircle, controlTools, isShadowCanvas, hoverType) {
	let outCircle = {}
	outCircle = Object.assign(outCircle, contrCle)
	outCircle.radius = centerCircle.radius * 2 + 1


	for (let i = 0; i < 3; i++) {
		let shadowColor = null
		let isHover = controlType[hoverType] === i

		if (isShadowCanvas && controlTools) {
			shadowColor = controlTools[i].__indexColor
		}
		if (i === 0) {
			drawContrCircle(ctx, centerCircle, shadowColor, outCircle, isHover, i)
			continue
		}
		let sAToEa = outCircle.endAngle - outCircle.startAngle;
		outCircle.startAngle = outCircle.endAngle + spaceAngle;
		outCircle.endAngle = outCircle.startAngle + sAToEa;
		drawContrCircle(ctx, centerCircle, shadowColor, outCircle, isHover, i);
	}
}

function drawContrCircle(ctx, centerCle, shadowColor, outCircle, isHover, iconIndex) {
	ctx.save()

	if (shadowColor) {
		ctx.fillStyle = shadowColor
	} else if (isHover) {
		ctx.fillStyle = '#A4A4A4'
	} else {
		ctx.fillStyle = '#DDDDDD'
	}

	outCircle.x = centerCle.x
	outCircle.y = centerCle.y

	outCircle.insideRadius = centerCle.radius + outCircle.space // 内层半径
	outCircle.ruPointX = outCircle.x + outCircle.radius * Math.cos(outCircle.startAngle)
	outCircle.ruPointY = outCircle.y + outCircle.radius * Math.sin(outCircle.startAngle)

	let endPosition = getEndPosition(outCircle, true)
	outCircle.ldPointX = endPosition.ex
	outCircle.ldPointY = endPosition.ey



	ctx.beginPath()
	ctx.arc(outCircle.x, outCircle.y, outCircle.radius, outCircle.startAngle, outCircle.endAngle)
	ctx.lineTo(outCircle.ldPointX, outCircle.ldPointY)
	ctx.arc(outCircle.x, outCircle.y, outCircle.insideRadius, outCircle.endAngle, outCircle.startAngle, true)
	ctx.lineTo(outCircle.ruPointX, outCircle.ruPointY)
	ctx.closePath()
	ctx.fill()
	ctx.restore()

	if (!shadowColor) {
		drawIcon(iconIndex, outCircle, ctx);
	}
}

function drawIcon(iconIndex, outCircle, ctx) {
	let icon = icons[iconIndex];
	let drawSize = {
		width: 4,
		height: 4
	};
	let iconPosition = getIconPosition(outCircle, iconIndex, drawSize);
	ctx.drawImage(icon, iconPosition.x, iconPosition.y, drawSize.width, drawSize.height);
}

/**
 * 求终点坐标
 * @param {*} contrCircle 控制轮盘
 * @param {*} isInside 内层与否
 */
function getEndPosition(contrCircle, isInside = false) {
	let arc = contrCircle.endAngle
	let radius = isInside ? contrCircle.insideRadius : contrCircle.radius;
	let ex = radius * Math.cos(arc) + contrCircle.x
	let ey = radius * Math.sin(arc) + contrCircle.y

	return {
		ex,
		ey
	}
}

/**
 * 求对应控制轮盘的icon的坐标
 * @param {*} outCircle 控制轮盘
 * @param {*} iconIndex 图标索引
 * @param {*} drawSize 绘制尺寸
 */
function getIconPosition(outCircle, iconIndex, drawSize) {
	let line = outCircle.insideRadius
	let angle = outCircle.startAngle + (outCircle.endAngle - outCircle.startAngle) / 2
	let x = outCircle.x + line * Math.cos(angle)
	let y = outCircle.y + line * Math.sin(angle)

	if (iconIndex === 0) {
		y -= drawSize.height / 2
		x += 0.6
	}
	if (iconIndex === 1) {
		x -= drawSize.width / 2
	}
	if (iconIndex === 2) {
		x -= drawSize.width
		y -= drawSize.height / 2
		// 微调图标
		x -= 0.4
	}

	return {
		x,
		y
	}
}