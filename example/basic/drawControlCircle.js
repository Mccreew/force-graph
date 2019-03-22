function drawContrCircle(ctx, centerCle, contrCle) {
	ctx.save()
	ctx.fillStyle = '#EAECEE'

	contrCle.x = centerCle.x
	contrCle.y = centerCle.y

	contrCle.insideRadius = centerCle.radius + contrCle.space
	contrCle.ruPointX = contrCle.x + contrCle.radius * Math.cos(contrCle.startAngle)
	contrCle.ruPointY = contrCle.y + contrCle.radius * Math.sin(contrCle.startAngle)

	let endPosition = getEndPosition(contrCle)
	contrCle.luPointX = endPosition.ex
	contrCle.luPointY = endPosition.ey



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
