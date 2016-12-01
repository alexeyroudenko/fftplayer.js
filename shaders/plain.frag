//
//  Gradient
//	http://www.alexeyrudenko.com/
//
//  Created by Alexey Roudenko on 05/08/15.
//  Copyright (c) 2015 Alexey Roudenko. All rights reserved.
//

//	uniform float u_time;: shader playback time (in seconds)
//	uniform vec2 u_resolution;: viewport resolution (in pixels)
//	uniform vec2 u_mouse;: mouse pixel coords (xy: pos, zw: buttons)
//	varying vec2 v_texcoord: UV of the billboard ( normalized )

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_volume;

void main()	{
	float u_size = 4.0;
	float aspect = u_resolution.x / u_resolution.y;
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;
	vec2 position = 0.5 - uv;
	vec2 uva = vec2(position.x, position.y / aspect);
	vec2 uvd = uva;
	uvd.x += 0.0 * cos(15. * uvd.y + 0.1 * u_time);
	uvd.y += 0.0 * sin(10. * uvd.x + 10.0 * u_time);
	float r = 0.1 * sqrt(dot(uvd, uvd));
	//float value = (1.0 * sin(u_size * 10.0 * r - .1 * u_volume));
	float value = 1.0 * (1.0 * sin(u_size * 10.0 * r + 1.1 * u_volume - .01 * sin(u_time)));
	float col = smoothstep(0.500, 0.503, value);// - 1.0 * value;
	vec3 color = vec3(col, col, col);
	gl_FragColor = vec4(color, 1.0);
}
