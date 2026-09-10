export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    /*
     * CORS
     */
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://brandivadigital.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    /*
     * Handle browser preflight request
     */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    /*
     * CREATE RAZORPAY ORDER
     *
     * POST /api/create-order
     */
    if (
      url.pathname === "/api/create-order" &&
      request.method === "POST"
    ) {

      try {

        const body = await request.json();

        const amount = Number(body.amount);
        const receipt =
          body.receipt ||
          `brandiva_${Date.now()}`;


        /*
         * Minimum Razorpay amount:
         * 100 paise = ₹1
         */
        if (
          !Number.isInteger(amount) ||
          amount < 100
        ) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Invalid amount. Minimum amount is 100 paise."
            }),
            {
              status: 400,
              headers: corsHeaders
            }
          );

        }


        /*
         * Razorpay authentication
         *
         * KEY SECRET NEVER reaches frontend.
         */
        const credentials =
          btoa(
            `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
          );


        const razorpayResponse =
          await fetch(
            "https://api.razorpay.com/v1/orders",
            {
              method: "POST",

              headers: {
                "Authorization":
                  `Basic ${credentials}`,

                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                amount: amount,
                currency: "INR",
                receipt: receipt
              })
            }
          );


        const data =
          await razorpayResponse.json();


        /*
         * Authentication failure
         */
        if (razorpayResponse.status === 401) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Razorpay authentication failed."
            }),
            {
              status: 401,
              headers: corsHeaders
            }
          );

        }


        /*
         * Other Razorpay API errors
         */
        if (!razorpayResponse.ok) {

          return new Response(
            JSON.stringify({
              success: false,
              error:
                data.error?.description ||
                "Unable to create Razorpay order."
            }),
            {
              status: 500,
              headers: corsHeaders
            }
          );

        }


        /*
         * Return only what frontend needs.
         */
        return new Response(
          JSON.stringify({
            success: true,
            order_id: data.id,
            amount: data.amount,
            currency: data.currency
          }),
          {
            status: 200,
            headers: corsHeaders
          }
        );


      } catch (error) {

        return new Response(
          JSON.stringify({
            success: false,
            error: "Server error while creating order."
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );

      }

    }


    /*
     * VERIFY RAZORPAY PAYMENT
     *
     * POST /api/verify-payment
     */
    if (
      url.pathname === "/api/verify-payment" &&
      request.method === "POST"
    ) {

      try {

        const body = await request.json();

        const {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        } = body;


        /*
         * Required fields
         */
        if (
          !razorpay_order_id ||
          !razorpay_payment_id ||
          !razorpay_signature
        ) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Missing payment verification fields."
            }),
            {
              status: 400,
              headers: corsHeaders
            }
          );

        }


        /*
         * Signature string:
         *
         * order_id + "|" + payment_id
         */
        const message =
          `${razorpay_order_id}|${razorpay_payment_id}`;


        /*
         * Convert secret to HMAC key
         */
        const encoder =
          new TextEncoder();

        const keyData =
          encoder.encode(
            env.RAZORPAY_KEY_SECRET
          );


        const cryptoKey =
          await crypto.subtle.importKey(
            "raw",
            keyData,
            {
              name: "HMAC",
              hash: "SHA-256"
            },
            false,
            ["sign"]
          );


        /*
         * Generate HMAC-SHA256
         */
        const signatureBuffer =
          await crypto.subtle.sign(
            "HMAC",
            cryptoKey,
            encoder.encode(message)
          );


        /*
         * Convert generated signature to hex
         */
        const generatedSignature =
          Array.from(
            new Uint8Array(signatureBuffer)
          )
          .map(
            byte =>
              byte
                .toString(16)
                .padStart(2, "0")
          )
          .join("");


        /*
         * Compare signatures
         */
        if (
          generatedSignature !==
          razorpay_signature
        ) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "Payment signature verification failed."
            }),
            {
              status: 400,
              headers: corsHeaders
            }
          );

        }


        /*
         * PAYMENT VERIFIED
         */
        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment verified successfully.",
            payment_id:
              razorpay_payment_id,
            order_id:
              razorpay_order_id
          }),
          {
            status: 200,
            headers: corsHeaders
          }
        );


      } catch (error) {

        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Server error while verifying payment."
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        );

      }

    }


    /*
     * Everything else
     */
    return new Response(
      JSON.stringify({
        success: false,
        error: "Endpoint not found."
      }),
      {
        status: 404,
        headers: corsHeaders
      }
    );

  }
};
