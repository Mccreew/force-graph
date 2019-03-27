const pi = Math.PI
let spaceAngle = pi / 100

let contrCle = {}
// contrCle.radius = 100
contrCle.startAngle = pi * 3 / 2 + spaceAngle
contrCle.endAngle = pi * 3 / 2 + pi * 2 / 3
contrCle.space = 0.3


export default function (ctx, centerCircle, controlTools, isShadowCanvas) {
	let outCircle = {}
	outCircle = Object.assign(outCircle, contrCle)
	outCircle.radius = centerCircle.radius * 2 + 1


	for (let i = 0; i < 3; i++) {
		let shadowColor = null
		if (isShadowCanvas && controlTools) {
			shadowColor = controlTools[i].__indexColor
		}
		if (i === 0) {
			drawContrCircle(ctx, centerCircle, shadowColor, outCircle)
			continue
		}
		let sAToEa = outCircle.endAngle - outCircle.startAngle;
		outCircle.startAngle = outCircle.endAngle + spaceAngle;
		outCircle.endAngle = outCircle.startAngle + sAToEa;
		drawContrCircle(ctx, centerCircle, shadowColor, outCircle);
	}
}

function drawContrCircle(ctx, centerCle, shadowColor, outCircle) {
	ctx.save()


	// ctx.fillStyle = 'rgb(' + (244 + i * 30) + ', ' + (208 + i * 20) + ', ' + (63 + i) +')'
	ctx.fillStyle = shadowColor ? shadowColor : '#626567'

	outCircle.x = centerCle.x
	outCircle.y = centerCle.y

	outCircle.insideRadius = centerCle.radius + outCircle.space
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
}

// 求终点坐标
function getEndPosition(contrCircle, isInside = false) {
	let arc = contrCircle.endAngle
	let radius = isInside ? contrCircle.insideRadius : contrCircle.radius;
	let ex = radius * Math.cos(arc) + contrCircle.x
	let ey = radius * Math.sin(arc) + contrCircle.y

	return {ex, ey}
}
