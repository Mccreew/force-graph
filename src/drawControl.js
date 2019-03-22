const pi = Math.PI
let spaceAngle = pi / 100

let contrCle = {}
// contrCle.radius = 100
contrCle.startAngle = pi * 3 / 2 + spaceAngle
contrCle.endAngle = pi * 3 / 2 + pi * 2 / 3
// contrCle.space = 5

export default function (ctx, centerCircle) {
	contrCle.radius = centerCircle.radius * 2.3
	contrCle.space = 0.5

	for (let i = 0; i < 3; i++) {
		if (i === 0) {
			drawContrCircle(ctx, centerCircle)
			continue
		}
		let sAToEa = contrCle.endAngle - contrCle.startAngle
		contrCle.startAngle = contrCle.endAngle + spaceAngle
		contrCle.endAngle = contrCle.startAngle + sAToEa
		drawContrCircle(ctx, centerCircle)
	}
}

function drawContrCircle(ctx, centerCle) {
	/************/
	console.log('contrCircle: ', contrCle.radius)
	console.log('centerCle: ', centerCle.radius)


	ctx.save()
	ctx.fillStyle = '#EAECEE'
	// ctx.fillStyle = 'rgb(' + (244 + i * 30) + ', ' + (208 + i * 20) + ', ' + (63 + i) +')'

	contrCle.x = centerCle.x
	contrCle.y = centerCle.y

	contrCle.insideRadius = centerCle.radius + contrCle.space
	contrCle.ruPointX = contrCle.x + contrCle.radius * Math.cos(contrCle.startAngle)
	contrCle.ruPointY = contrCle.y + contrCle.radius * Math.sin(contrCle.startAngle)
	// contrCle.rdPointX = contrCle.x + contrCle.insideRadius * Math.cos(contrCle.startAngle)
	// contrCle.rdPointY = contrCle.y + contrCle.insideRadius * Math.sin(contrCle.startAngle)

	let endPosition = getEndPosition(contrCle, true)
	// endPosition = getEndPosition(contrCle, true)
	contrCle.ldPointX = endPosition.ex
	contrCle.ldPointY = endPosition.ey



	ctx.beginPath()
	ctx.arc(contrCle.x, contrCle.y, contrCle.radius, contrCle.startAngle, contrCle.endAngle)
	ctx.lineTo(contrCle.ldPointX, contrCle.ldPointY)
	ctx.arc(contrCle.x, contrCle.y, contrCle.insideRadius, contrCle.endAngle, contrCle.startAngle, true)
	ctx.lineTo(contrCle.ruPointX, contrCle.ruPointY)
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

	return { ex, ey }
}
