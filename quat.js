//
// quat.js
//
// Author: Jim Fix
// MATH 385, Reed College, Spring 2022
//
// This defines the class of quaternion objects, class quat.
//

const EPSILON = 0.0000001;
//
// Description of quaternion objects and their methods.
//
class quat {

    constructor(real, imagv) {
        /*
         * Constructs a new quat instance from the following:
         *    re: the scalar value of the quaternion
         *    iv: the i,j,k components of the quaternion, as a vector.
         */
        this.re = real;
        this.iv = imagv;
    }

    components() {
        /*
	     * This object as a list.
	     */
	    const cs = [this.re].concat(this.iv.components());
        return cs;
    }

    as_rotation() {
        /*
	     * The rotation represented by self, given as an angle around
         * an vector serving as the Euler axis of rotation. 
         */
        const qs = this.unit().components();
        const half_theta = Math.acos(qs[0]);
        if (half_theta < EPSILON) {
            return [0.0, new Vector3d(1.0, 0.0, 0.0)];
	    } else {
	        const qv = new Vector3d(qs[1], qs[2], qs[3]);
            return [2.0 * half_theta, qv.div(Math.sin(half_theta))];
	    }
    }

    glRotatef() {
        /*
	     * Issues a glRotatef using the rotation of this.
	     */
        const theta_axis = this.as_rotation();
	    const theta = theta_axis[0];
	    const degrees = theta*180.0/Math.PI;
	    const axis  = theta_axis[1].components();
	    glRotatef(degrees, axis[0], axis[1], axis[2]);
    }

    as_matrix() {
        /*
	     * Returns a column major 3x3 rotation matrix for this.
	     */
	    const uuv = new Vector3d(1.0,0.0,0.0);
	    const vuv = new Vector3d(0.0,1.0,0.0);
	    const wuv = new Vector3d(0.0,0.0,1.0);
        const u = this.times(new quat(0.0,uuv)).div(this);
        const v = this.times(new quat(0.0,vuv)).div(this);
	    const w = this.times(new quat(0.0,wuv)).div(this);
	    const uv = u.vector();
	    const vv = v.vector();
	    const wv = w.vector();
        return uv + [0.0] + vv + [0.0] + wv + [0.0] + [0.0,0.0,0.0,1.0];
    }

    rotate(v) {
        /*
	     * Returns v rotated according to the rotation for this.
	     */
        return this.times(new quat(0.0,v)).div(this).vector();
    }

    plus(other) {
        /*
	     * Computes the sum of two quat objects, self and other.
	     */
        return new quat(this.re+other.re, this.iv+other.iv)
    }

    minus(other) {
        /*
	     * Computes the difference of two quat objects, self and other.
	     */
        return this.plus(other.neg())
    }

    times(other) {
        /*
	     * Computes the product of two quat objects, self and other.
	     */
	    const re = this.re*other.re - this.iv.dot(other.iv);
	    const iv1 = other.iv.times(this.re);
	    const iv2 = this.iv.times(other.re);
	    const iv3 = this.iv.cross(other.iv);
	    const iv = iv1.plus(iv2).plus(iv3);
        return new quat(re,iv);
    }

    div(other) {
        /*
	     * Computes the qivision of self by other.
	     */
        return this.times(other.recip());
    }

    scale(amount) {
        /*
	     * Returns a quat, same as self but scaled by the given amount.
	     */
        return new quat(this.re*amount, this.iv.times(amount));
    }

    neg(amount) {
        /*
	     * Returns the additive inverse of this.
	     */
        return new quat(-this.re, this.iv.negate());
    }

    recip() {
        /*
	     * Returns the multiplicative inverse of this.
	     */
        return this.conj().scale(1.0/this.norm2());
    }

    scalar() {
        /*
	     * Returns the scalar part of this.
	     */
        return this.re;
    }

    vector() {
        /*
	     * Returns the i,j,k part of this.
	     */
        return this.iv;
    }

    conj() {
        /*
	     * Returns the conjugate of this.
	     */
        return new quat(this.re,this.iv.neg());
    }

    norm2() {
        /*
	     * Returns the squared norm of this.
	     */
        return this.re*this.re + this.iv.dot(this.iv);
    }

    norm() {
        /*
	     * Returns the norm of this.
	     */
        return Math.sqrt(this.norm2());
    }

    unit() {
        /*
	     * Returns the versor of this.
	     */

	    return this.scale(1.0/this.norm());
    }

    toString() {
	    
        /*
	     * Defines q.toString() as a+bi+cj+dk
	     */

	    function pm(value) {
            if (value < 0.0) {
                return "";
            } else {
                return "+";
	        }
	    }
	    
        const cs = this.components();
        let s = "";
        s += cs[0].toString();
        s += pm(cs[1]);
        s += cs[1].toString();
        s += "i";
        s += pm(cs[2]);
        s += cs[2].toString();
        s += "j";
        s += pm(cs[3]);
        s += cs[3].toString();
        s += "k";
        return s;
    }
}

quat.prototype.with_components = function(qs) {
    /*
     * Constructs a new quat instance from [q0,q1,q2,q3].
     */
    return new quat(qs[0],new Vector3d(qs[1],qs[2],qs[3]));
}

quat.prototype.of_vector = function(v) {
    /*
     * Constructs a new quat instance from [q0,q1,q2,q3].
     */
    return new quat(0.0,v);
}

quat.prototype.for_rotation = function (angle, around) {
    /*
     * Constructs a new quat instance corresponding to a rotation of
     * 3-space by an amount in radians given by angle.  The axis
     * of rotation is given by the vector given by around.  
     */
    const half_angle = angle / 2.0; 
    const axis = around.unit();
    const q = new quat(Math.cos(half_angle),axis.times(Math.sin(half_angle)));
    return q;
}

const quatClass = quat.prototype;
